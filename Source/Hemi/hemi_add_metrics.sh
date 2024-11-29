mkdir -p /root/Grafana_node_checker
source .profile
sudo apt-get update
npm install prom-client fs child_process https

# Скачиваем скрипт с чекером
curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Hemi/hemi_balance_check.js > "/root/Grafana_node_checker/hemi_balance_1h_check.js"
curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Hemi/hemi_txn_1h_diff_check.js > "/root/Grafana_node_checker/hemi_txn_1h_diff_check.js"

# Запрос значения node_id у пользователя
read -p "Укажите значение node_id: " node_id

# Замена текста your_node_id_here значением node_id
sed -i "s/your_node_id_here/$node_id/g" "/root/Grafana_node_checker/hemi_balance_1h_check.js"
sed -i "s/your_node_id_here/$node_id/g" "/root/Grafana_node_checker/hemi_txn_1h_diff_check.js"

# Получаем абсолютный путь к nodejs
node_path=$(which node)

# Добавляем файл в крон с частотой выполнения каждую минуту
source .profile
cron_entry="0 * * * * $node_path /root/Grafana_node_checker/hemi_balance_check.js"
sudo crontab -l | { cat; echo "$cron_entry"; } | sudo crontab -
cron_entry="0 * * * * $node_path /root/Grafana_node_checker/hemi_txn_1h_diff_check.js"
sudo crontab -l | { cat; echo "$cron_entry"; } | sudo crontab -

$node_path /root/Grafana_node_checker/hemi_txn_1h_diff_check.js
$node_path /root/Grafana_node_checker/hemi_balance_check.js

# Добавляем в сервисник Node Exporter ключ для запуска сервиса с папкой с новой метрикой
if ! grep -q -- "--collector.textfile.directory=/var/lib/prometheus/node-exporter" /lib/systemd/system/prometheus-node-exporter.service; then
  sudo sed -i '/^ExecStart/s|$| --collector.textfile.directory=/var/lib/prometheus/node-exporter|' /lib/systemd/system/prometheus-node-exporter.service
  sudo systemctl daemon-reload
  sudo systemctl restart prometheus-node-exporter
fi

echo "Готово, если нет ошибок выполнения скрипта"
