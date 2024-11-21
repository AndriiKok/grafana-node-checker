# Мониторинг проектов в Grafana 

Важные предусловия: 
1. Установлена Grafana по моему гайду https://github.com/AndriiKok/grafana, чтобы была предсказуемая структура данных.
2. Установлена nodejs, проверьте node -v и npm -v.
<br/>
<br/>

## Подготовка
1. Создайте API ключ для взаимодействия с Grafana. Для этого перейдите в боковом меню Grafana слева в раздел Configuration - API Keys, далее Add API key, укажите имя, роль Admin и время достаточное, чтобы долго не вспоминать об этом. Сохраните ключ, позднее вам понадобится ввести его один раз, скрипт запишет его в .profile для дальнейшей работы с виджетом.
2. Вам понадобится UID вашего текущего дашборда. Если вы сейчас смотрите на виджет мониторинга серверов, то UID здесь: <br/>
 ![image](https://github.com/user-attachments/assets/493b0e11-05ba-4593-a6e3-e1b1c408238c)
<br/>
<br/>

## Добавляем новый виджет в Grafana
Потребуется указать API ключ, UID дашборда и адрес сервера в формате XX.XX.XX.XX, на котором стоит Grafana:

	bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Add_panel/add_new_panel.sh)

Готово, скрипт также вернул UID нового виджета и записал всё в .profile.
<br/>
<br/>

## Проекты
Скрипт "Метрика" выполнит следующие задачи:
- установит необходимые npm пакеты
- сохранит в папке /root/Grafana_node_checker скрипт-чекер для необходимой ноды
- добавит в cron расписание на ежеминутное выполнение скрипта-чекера
- скрипт-чекер создаст файл с метрикой в папке /var/lib/prometheus/node-exporter и при каждом выполнении по расписанию обновит значения метрики
- пропишет в сервисник Node exporter запуск с ключом, который укажет на необходимость добавить новую метрику из папки /var/lib/prometheus/node-exporter в общий список метрик

Скрипт "Колонка" добавит новую колонку под добавляемую метрику ноды. Добавляйте колонки с того же сервера, откуда ставили новый виджет, чтобы не вводить каждый раз ключ, адрес и uid дашборда и виджета.
<br/>
<br/>
<br/>

## Waku
### Проверка healthcheck
Метрики

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Waku/waku_add_metrics.sh)


Колонки 

	bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Waku/waku_add_columns.sh)





<br/>
<br/>
<br/>
<br/>

## Если всё сломалось

Можем быстро восстановить первоначальный вид дашборда мониторинга серверов. Удаляем текущий дашборд через управление дашбордами, копируем содержимое файла ниже и через импорт создаём новый дашборд. У вас изменится UID дашборда, замените на новый в .profile.

 	https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/json_model_original.json


