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

source ~/.profile
echo "Значения успешно добавлены или загружены из .profile"

read -p "Укажите максимальное количество валидаторов для ноды в вашем случае (например, 10 или 2): " max_validators

# Массив букв алфавита 
alphabet=( {A..Z} )

# Скачиваем скрипт и вставляем значения переменных
mkdir -p /root/adding_panel
curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Add_panel/dill_validators_balance_panel.js > "/root/adding_panel/dill_validators_balance_panel.js"
sed -i "s/server_ip/${GRAFANA_SERVER_IP}/g" /root/adding_panel/dill_validators_balance_panel.js
sed -i "s/api_key/${GRAFANA_API_KEY}/g" /root/adding_panel/dill_validators_balance_panel.js
sed -i "s/dash_uid/${DASHBOARD_UID}/g" /root/adding_panel/dill_validators_balance_panel.js

echo "Устанавливаем требуемые пакеты npm..."
source ~/.profile
npm install axios

# Запуск файла add_new_panel.js с помощью Node.js
echo "Создаём новую панель для вашего дашборда..."
PANEL_DILL_UID=$($(which node) /root/adding_panel/add_new_panel.js | grep 'PANEL_UID' | awk -F': ' '{print $2}')

# Проверка успешности выполнения скрипта
if [ -n "$PANEL_DILL_UID" ]; then echo "Готово, обновите свой дашборд" 
echo "export PANEL_DILL_UID=${PANEL_DILL_UID}" >> ~/.profile
else
  sed -i '/export GRAFANA_API_KEY=/d' ~/.profile
  sed -i '/export DASHBOARD_UID=/d' ~/.profile
  sed -i '/export GRAFANA_SERVER_IP=/d' ~/.profile
  echo "Произошла ошибка при выполнении скрипта, все введённые данные удалены"
fi


# Основной цикл
for i in $(seq 1 $max_validators); do
  # Скачивание файла и сохранение с уникальным именем
  curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Dill/dill_balance_multi_add_column.js -o "/root/adding_panel/dill_balance_multi_add_column_${i}.js"

  # Получение соответствующей буквы алфавита
  letter=${alphabet[$((i-1))]}

  # Замена значений в файле
  sed -i "s/server_ip/${GRAFANA_SERVER_IP}/g" /root/adding_panel/dill_balance_multi_add_column_${i}.js
  sed -i "s/api_key/${GRAFANA_API_KEY}/g" /root/adding_panel/dill_balance_multi_add_column_${i}.js
  sed -i "s/dash_uid/${DASHBOARD_UID}/g" /root/adding_panel/dill_balance_multi_add_column_${i}.js
  sed -i "s/panel_dill_uid/${PANEL_DILL_UID}/g" /root/adding_panel/dill_balance_multi_add_column_${i}.js
  sed -i "s/Account_column_name/Account$(($i-1))/g" /root/adding_panel/dill_balance_multi_add_column_${i}.js
  sed -i "s/dill_balance_account/dill_balance_account$(($i-1))/g" /root/adding_panel/dill_balance_multi_add_column_${i}.js
  sed -i "s/V_V/${letter}/g" /root/adding_panel/dill_balance_multi_add_column_${i}.js
done

# Удаление папки /root/adding_panel вместе с её содержимым
rm -rf /root/adding_panel
