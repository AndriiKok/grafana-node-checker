#!/bin/bash

# Запрашиваем ввод значения Grafana API Key
read -p "Введите значение Grafana API Key: " grafana_api_key
echo "export GRAFANA_API_KEY=${grafana_api_key}" >> ~/.profile

# Запрашиваем ввод значения Dashboard UID
read -p "Введите значение Dashboard UID: " dashboard_uid
echo "export DASHBOARD_UID=${dashboard_uid}" >> ~/.profile

# Определяем IP-адрес текущего сервера
grafana_server_ip=$(hostname -I | awk '{print $1}')
echo "export SERVER_IP=${grafana_server_ip}" >> ~/.profile

source ~/.profile
echo "Значения успешно добавлены в .profile"

# Скачиваем скрипт и вставляем значения переменных
mkdir -p /root/adding_panel
curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Add_panel/Add_new_panel.js > "/root/adding_panel/add_new_panel.js"
sed -i "s/server_ip/${server_ip}/g" /root/adding_panel/add_new_panel.js
sed -i "s/api_key/${grafana_api_key}/g" /root/adding_panel/add_new_panel.js
sed -i "s/dash_uid/${dashboard_uid}/g" /root/adding_panel/add_new_panel.js

echo "Устанавливаем требуемые пакеты npm..."
source ~/.profile
npm install axios

# Запуск файла add_new_panel.js с помощью Node.js
echo "Создаём новую панель для вашего дашборда..."
$(which node) /root/adding_panel/add_new_panel.js

# Проверка успешности выполнения скрипта
if [ $? -eq 0 ]; then
  echo "Готово, проверяйте свой дашборд"
  
  # Удаление папки /root/adding_panel вместе с её содержимым
  rm -rf /root/adding_panel
else
  echo "Произошла ошибка при выполнении скрипта."
fi
