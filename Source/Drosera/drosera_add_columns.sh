#!/bin/bash

# Функция для проверки наличия переменной в .profile и её загрузки
load_or_prompt() {
  local var_name=$1
  local prompt_message=$2
  local profile_file=~/.profile

  # Проверка, есть ли переменная в .profile
  if grep -q "export $var_name=" "$profile_file"; then
    # Если переменная есть, загружаем её значение
    source "$profile_file"
    eval local var_value=\$$var_name
    echo "$var_name найдено в .profile: $var_value"
  else
    # Если переменной нет, запрашиваем её у пользователя
    read -p "$prompt_message" var_value
    echo "export $var_name=${var_value}" >> "$profile_file"
    echo "$var_name добавлено в .profile: $var_value"
  fi

  eval $var_name=\$var_value
}

# Запрашиваем или загружаем значения переменных
load_or_prompt "GRAFANA_API_KEY" "Введите значение Grafana API Key: "
load_or_prompt "DASHBOARD_UID" "Введите значение Dashboard UID: "
load_or_prompt "GRAFANA_SERVER_IP" "Введите значение Grafana Server IP: "
load_or_prompt "PANEL_UID" "Введите значение Panel UID: "

source ~/.profile
echo "Значения успешно добавлены или загружены из .profile"

# Скачиваем скрипт и вставляем значения переменных
mkdir -p /root/adding_panel_column
curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Drosera/drosera_health_add_column.js > "/root/adding_panel_column/drosera_health_add_column.js"
sed -i "s/server_ip/${GRAFANA_SERVER_IP}/g" /root/adding_panel_column/waku_health_add_column.js
sed -i "s/api_key/${GRAFANA_API_KEY}/g" /root/adding_panel_column/waku_health_add_column.js
sed -i "s/dash_uid/${DASHBOARD_UID}/g" /root/adding_panel_column/waku_health_add_column.js
sed -i "s/panel_uid/${PANEL_UID}/g" /root/adding_panel_column/waku_health_add_column.js

echo "Устанавливаем требуемые пакеты npm..."
source ~/.profile
npm install axios

# Запуск файла add_new_panel.js с помощью Node.js
echo "Добавляем новые колонки для Waku..."
$(which node) /root/adding_panel_column/drosera_health_add_column.js

# Проверка успешности выполнения скрипта 
if [ $? -eq 0 ]; then 
 echo "Готово, обновите свой дашборд" 
 else 
  echo "Произошла ошибка при выполнении скрипта" 
fi 
  
# Удаление папки /root/adding_panel вместе с её содержимым 
rm -rf /root/adding_panel
