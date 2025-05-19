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

## ВАЖНО!
Скрипт для установки виджета, а также скрипты на добавление колонок в виджет мы запускаем только с одного хоста, на котором установлена графана. Эти скрипты направлены на внесение изменений в конфигурацию дашборда, поэтому нет необходимости запускать их на всех серверах.
<br/>
<br/>
Скрипты на добавление метрик мы запускаем на каждом сервере, ноды которых хотим мониторить.

<br/>
<br/>

## Добавляем новый виджет в Grafana
Потребуется указать API ключ, UID дашборда и адрес сервера в формате XX.XX.XX.XX, на котором стоит Grafana:

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Add_panel/add_new_panel.sh)

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

## Ritual
Метрика healthcheck

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Ritual/ritual_add_metrics.sh)


Колонка 

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Ritual/ritual_add_columns.sh)
<br/>

Метрика txn_event

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Ritual/ritual_txn_event.sh)


Колонка 

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Ritual/ritual_txn_event_add_column.sh)

<br/>
<br/>
<br/>

## Pipe
Метрика healthcheck

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Pipe/pipe_add_metrics.sh)


Колонка 

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Pipe/pipe_add_columns.sh)
<br/>
<br/>
<br/>


## Waku
Метрики healthcheck и peers

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Waku/waku_add_metrics.sh)


Колонки 

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Waku/waku_add_columns.sh)
<br/>
<br/>
<br/>

## Drosera
Метрика healthcheck

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Drosera/drosera_add_metrics.sh)


Колонки 

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Drosera/drosera_add_columns.sh)
<br/>
<br/>
<br/>

## Dill
Для тех, у кого один валидатор на ноде <br/>
Метрики healthcheck и balance 1h

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Dill/dill_add_metrics.sh)


Колонки 

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Dill/dill_add_columns.sh)

<br/>
<br/>
Для бояр с 2 и более валидаторами на ноде при запуске скрипта нужно указать максимальное количество валидаторов, которые могут отображаться в дашборде. Добавится новый виджет специально для Dill <br/>
Метрики healthcheck и balance 1h

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Dill/dill_balance_multi.sh)


Виджет и колонки 

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Dill/dill_balance_multi_add_all.sh)

<br/>
<br/>
<br/>

## Если всё сломалось

Можем быстро восстановить первоначальный вид дашборда мониторинга серверов. Удаляем текущий дашборд через управление дашбордами, копируем содержимое файла ниже и через импорт создаём новый дашборд. У вас изменится UID дашборда, замените на новый в .profile.

 	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Reset_dashboard.sh)


