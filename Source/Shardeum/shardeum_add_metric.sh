#!/bin/bash

# Создание директории для скриптов, если она не существует
mkdir -p /root/Grafana_node_checker
source ~/.profile

# Скачиваем скрипт с чекером
curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Shardeum/shardeum_status_check.sh > "/root/Grafana_node_checker/shardeum_status_check.sh"

# Добавляем файл в крон с частотой выполнения каждые 15 минут
cron_entry="*/15 * * * * bash /root/Grafana_node_checker/shardeum_status_check.sh"
(crontab -l 2>/dev/null; echo "$cron_entry") | crontab -

# Запускаем скрипт для проверки метрики
bash /root/Grafana_node_checker/shardeum_status_check.sh

# Добавляем в сервисник Node Exporter ключ для запуска сервиса с папкой с новой метрикой
if ! grep -q -- "--collector.textfile.directory=/var/lib/prometheus/node-exporter" /lib/systemd/system/prometheus-node-exporter.service; then
  sudo sed -i '/^ExecStart/s|$| --collector.textfile.directory=/var/lib/prometheus/node-exporter|' /lib/systemd/system/prometheus-node-exporter.service
  sudo systemctl daemon-reload
  sudo systemctl restart prometheus-node-exporter
fi

echo "Готово, если нет ошибок выполнения скрипта"
