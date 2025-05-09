mkdir -p /root/Grafana_node_checker
source .profile
sudo apt-get update
npm install prom-client fs child_process https ethers

# Скачиваем скрипт с чекером
curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Ritual/ritual_txn_event.js > "/root/Grafana_node_checker/ritual_txn_event.js"

CONFIG_PATH="/root/infernet-container-starter/deploy/config.json"

# Извлекаем приватный ключ из JSON (используем jq)
PRIVATE_KEY=$(jq -r '.chain.wallet.private_key' "$CONFIG_PATH")

# Конвертируем приватный ключ в публичный (используем Node.js)
PUBLIC_KEY=$(node -e "
    const { Wallet } = require('ethers');
    const wallet = new Wallet('$PRIVATE_KEY');
    console.log(wallet.address);
")

# Замена текста my_address значением PUBLIC_KEY
sed -i "s/my_address/$PUBLIC_KEY/g" "/root/Grafana_node_checker/ritual_txn_event.js"

# Получаем абсолютный путь к nodejs
node_path=$(which node)

# Добавляем файл в крон с частотой выполнения каждую минуту
source .profile
cron_entry="0 * * * * $node_path /root/Grafana_node_checker/ritual_txn_event.js"
sudo crontab -l | { cat; echo "$cron_entry"; } | sudo crontab -

$node_path /root/Grafana_node_checker/ritual_txn_event.js

# Добавляем в сервисник Node Exporter ключ для запуска сервиса с папкой с новой метрикой
if ! grep -q -- "--collector.textfile.directory=/var/lib/prometheus/node-exporter" /lib/systemd/system/prometheus-node-exporter.service; then
  sudo sed -i '/^ExecStart/s|$| --collector.textfile.directory=/var/lib/prometheus/node-exporter|' /lib/systemd/system/prometheus-node-exporter.service
  sudo systemctl daemon-reload
  sudo systemctl restart prometheus-node-exporter
fi

echo "Готово, если нет ошибок выполнения скрипта"
