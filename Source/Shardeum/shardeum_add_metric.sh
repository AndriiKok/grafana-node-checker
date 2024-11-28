#!/bin/bash

# Создание директории для скриптов, если она не существует
mkdir -p /root/Grafana_node_checker
source ~/.profile

if ! command -v screen &> /dev/null; then
    sudo apt update && sudo apt install screen -y 2>&1
fi

SESSION_NAME="shardeum"
screen -dmS "$SESSION_NAME"
sleep 1
screen -S "$SESSION_NAME" -X stuff "bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Shardeum/shardeum_status_check.sh)"
screen -S "$SESSION_NAME" -X stuff $'\n'

# Добавляем в сервисник Node Exporter ключ для запуска сервиса с папкой с новой метрикой
if ! grep -q -- "--collector.textfile.directory=/var/lib/prometheus/node-exporter" /lib/systemd/system/prometheus-node-exporter.service; then
  sudo sed -i '/^ExecStart/s|$| --collector.textfile.directory=/var/lib/prometheus/node-exporter|' /lib/systemd/system/prometheus-node-exporter.service
  sudo systemctl daemon-reload
  sudo systemctl restart prometheus-node-exporter
fi

echo "Готово, если нет ошибок выполнения скрипта"
