mkdir -p /root/Grafana_node_checker
source .profile
sudo apt-get update
npm install prom-client fs child_process

# Скачиваем скрипт с чекером
curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Dill/dill_health_check.js > "/root/Grafana_node_checker/dill_health_check.js"

# Получаем абсолютный путь к nodejs
node_path=$(which node)

# Добавляем файл в крон с частотой выполнения каждую минуту
source .profile
cron_entry="* * * * * $node_path /root/Grafana_node_checker/dill_health_check.js"
sudo crontab -l | { cat; echo "$cron_entry"; } | sudo crontab -

# Добавляем в сервисник Node Exporter ключ для запуска сервиса с папкой с новой метрикой
if ! grep -q -- "--collector.textfile.directory=/var/lib/prometheus/node-exporter" /lib/systemd/system/prometheus-node-exporter.service; then
  sudo sed -i '/^ExecStart/s|$| --collector.textfile.directory=/var/lib/prometheus/node-exporter|' /lib/systemd/system/prometheus-node-exporter.service
  sudo systemctl daemon-reload
  sudo systemctl restart prometheus-node-exporter
fi

echo "Готово, если нет ошибок выполнения скрипта"
