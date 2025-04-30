#!/bin/bash

# Заменяем строки в ~/infernet-container-starter/deploy/config.json
sed -i 's|"rpc_url": .*|"rpc_url": "https://base-rpc.publicnode.com/",|g' ~/infernet-container-starter/deploy/config.json
sed -i 's|"batch_size": .*|"batch_size": 1800,|g' ~/infernet-container-starter/deploy/config.json
sed -i 's|"starting_sub_id": .*|"starting_sub_id": 230000,|g' ~/infernet-container-starter/deploy/config.json

# Заменяем строки в ~/infernet-container-starter/projects/hello-world/container/config.json
sed -i 's|"rpc_url": .*|"rpc_url": "https://base-rpc.publicnode.com/",|g' ~/infernet-container-starter/projects/hello-world/container/config.json
sed -i 's|"batch_size": .*|"batch_size": 1800,|g' ~/infernet-container-starter/projects/hello-world/container/config.json
sed -i 's|"starting_sub_id": .*|"starting_sub_id": 230000,|g' ~/infernet-container-starter/projects/hello-world/container/config.json

# Удаляем блок "docker"
jq 'del(.docker)' ~/infernet-container-starter/projects/hello-world/container/config.json > /root/temp.json && mv /root/temp.json ~/infernet-container-starter/projects/hello-world/container/config.json
jq 'del(.docker)' ~/infernet-container-starter/deploy/config.json > /root/temp.json && mv /root/temp.json ~/infernet-container-starter/deploy/config.json

# Обновляем Docker-контейнер
echo "Останавливаем контейнеры"
docker compose -f $HOME/infernet-container-starter/deploy/docker-compose.yaml down
echo "Обновляем контейнер hello-world"
docker pull ritualnetwork/hello-world-infernet:latest
echo "Запускаем контейнеры"
docker compose -f $HOME/infernet-container-starter/deploy/docker-compose.yaml up -d

echo "Все изменения и обновления выполнены успешно!"
