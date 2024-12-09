#!/bin/bash

# Чтение данных из файла
output=$(cd /root/dill && ./show_pubkey.sh)

# Подсчет количества записей Account
account_count=$(echo "$output" | grep -o 'Account [0-9]' | wc -l)

# Получение абсолютного пути к nodejs
node_path=$(which node)

# Основной цикл
for i in $(seq 0 $(($account_count - 1))); do
  # Извлечение pubkey для текущего аккаунта
  pubkey=$(echo "$output" | awk -v acc="Account $i" '$0 ~ acc {getline; print}' | grep -oP '(0x[0-9a-fA-F]{64})')

  # Проверка на пустое значение pubkey
  if [ -z "$pubkey" ]; then
    echo "Ошибка: Не удалось извлечь pubkey для Account $i"
    continue
  fi

  # Скачивание и сохранение файла с новым именем
  curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Dill/dill_balance_multi.js > "/root/Grafana_node_checker/dill_balance_account${i}.js"

  # Замена PUB_KEY на текущий pubkey в файле
  sed -i "s/PUB_KEY/$pubkey/" "/root/Grafana_node_checker/dill_balance_account${i}.js"
  sed -i "s/dill_balance/dill_balance_account${i}/" "/root/Grafana_node_checker/dill_balance_account${i}.js"

  # Добавление записи в кронтаб для текущего аккаунта
  cron_entry="0 * * * * $node_path /root/Grafana_node_checker/dill_balance_account${i}.js"
  sudo crontab -l | { cat; echo "$cron_entry"; } | sudo crontab -
  
  $node_path /root/Grafana_node_checker/dill_balance_account${i}.js
  
done

if ! grep -q -- "--collector.textfile.directory=/var/lib/prometheus/node-exporter" /lib/systemd/system/prometheus-node-exporter.service; then 
  sudo sed -i '/^ExecStart/s|$| --collector.textfile.directory=/var/lib/prometheus/node-exporter|' /lib/systemd/system/prometheus-node-exporter.service 
  sudo systemctl daemon-reload 
  sudo systemctl restart prometheus-node-exporter 
fi

echo "Готово, если нет ошибок выполнения скрипта"
