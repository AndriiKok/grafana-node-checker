mkdir -p /root/Grafana_node_checker
source .profile
sudo apt-get update
PACKAGES=("prom-client" "fs" "child_process" "util")

# Перебираем каждый пакет в списке
for PACKAGE_NAME in "${PACKAGES[@]}"; do
  echo "Проверка наличия пакета ${PACKAGE_NAME}..."

  # Проверяем, установлен ли пакет на верхнем уровне
  # npm list --depth=0 возвращает 0, если пакет найден, и ненулевой код, если нет.
  if npm list --depth=0 "${PACKAGE_NAME}" > /dev/null 2>&1; then
    echo "Пакет ${PACKAGE_NAME} уже установлен."
  else
    echo "Пакет ${PACKAGE_NAME} не найден. Выполняю установку..."
    # Устанавливаем пакет
    if npm install "${PACKAGE_NAME}"; then
      echo "Пакет ${PACKAGE_NAME} успешно установлен."
    else
      echo "Ошибка при установке пакета ${PACKAGE_NAME}."
      # Выходим с ошибкой, если установка не удалась для любого пакета
      exit 1
    fi
  fi
  echo "---" # Разделитель между проверками пакетов
done

# Скачиваем скрипт с чекером
curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Pipe/pipe_health_check.js > "/root/Grafana_node_checker/pipe_health_check.js"

# Получаем абсолютный путь к nodejs
node_path=$(which node)

# Добавляем файл в крон с частотой выполнения каждую минуту
source .profile
cron_entry="* * * * * $node_path /root/Grafana_node_checker/pipe_health_check.js"
sudo crontab -l | { cat; echo "$cron_entry"; } | sudo crontab -

# Добавляем в сервисник Node Exporter ключ для запуска сервиса с папкой с новой метрикой
if ! grep -q -- "--collector" /lib/systemd/system/prometheus-node-exporter.service; then
  sudo sed -i 's|ExecStart=/usr/bin/prometheus-node-exporter $ARGS|ExecStart=/usr/bin/prometheus-node-exporter $ARGS --collector.textfile.directory=/var/lib/prometheus/node-exporter/|' /lib/systemd/system/prometheus-node-exporter.service
  sudo systemctl daemon-reload
  sudo systemctl restart prometheus-node-exporter
fi

echo "Готово, если нет ошибок выполнения скрипта"
