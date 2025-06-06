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

# Указываем необходимые переменные
json_url="https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/json_model_original.json"
dashboard_api_url="http://${GRAFANA_SERVER_IP}:3002/api/dashboards/uid/${DASHBOARD_UID}"
api_url="http://${GRAFANA_SERVER_IP}:3002/api/dashboards/db"

# Проверяем URL и ключи
echo "Проверка переменных:"
echo "GRAFANA_API_KEY: $GRAFANA_API_KEY"
echo "DASHBOARD_UID: $DASHBOARD_UID"
echo "GRAFANA_SERVER_IP: $GRAFANA_SERVER_IP"
echo "JSON URL: $json_url"
echo "Dashboard API URL: $dashboard_api_url"
echo "API URL: $api_url"

# Получаем текущий дашборд
echo "Получение текущего дашборда по адресу: $dashboard_api_url"
dashboard_data=$(curl -s -H "Authorization: Bearer $GRAFANA_API_KEY" "$dashboard_api_url")
echo "Данные дашборда: $dashboard_data"

# Извлекаем title, uid и version
current_title=$(echo "$dashboard_data" | jq -r '.dashboard.title')
current_uid=$(echo "$dashboard_data" | jq -r '.dashboard.uid')
current_version=$(echo "$dashboard_data" | jq -r '.dashboard.version')

# Проверка, что переменные были успешно извлечены
echo "Текущий title: $current_title"
echo "Текущий uid: $current_uid"
echo "Текущая версия: $current_version"

# Если current_title пустое, задать значение вручную или по умолчанию
if [ -z "$current_title" ]; then
  current_title="Default Title"
  echo "Title пустое, устанавливаем значение по умолчанию: $current_title"
fi

# Скачиваем JSON модель дашборда
curl -sSL "$json_url" -o /tmp/json_model_original.json

# Обновляем значения title, uid и version в JSON модели
jq --arg title "$current_title" --arg uid "$current_uid" --arg version "$current_version" '.dashboard.title = $title | .dashboard.uid = $uid | .dashboard.version = ($version | tonumber)' /tmp/json_model_original.json > /tmp/json_model_updated.json

# Читаем обновленное содержимое файла
json_data=$(cat /tmp/json_model_updated.json)

# Подготавливаем данные для обновления дашборда
update_payload=$(jq -n --argjson dashboard "$json_data" '{dashboard: $dashboard, overwrite: true}')

# Отправляем запрос на обновление дашборда
echo "Отправка запроса на обновление дашборда по адресу: $api_url"
response=$(curl -s -X POST "$api_url" -H "Authorization: Bearer $GRAFANA_API_KEY" -H "Content-Type: application/json" -d "$update_payload")

# Проверка результата
if [[ $response == *"success"* ]]; then
  echo "Готово, обновите страницу с дашбордом"
else
  echo "Произошла ошибка при обновлении дашборда"
  echo "Ответ сервера: $response"
fi

# Удаляем временные файлы
rm /tmp/json_model_original.json
rm /tmp/json_model_updated.json
