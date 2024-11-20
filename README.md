# Мониторинг проектов в Grafana 

Важные предусловия: 
1. Установлена Grafana по моему гайду https://github.com/AndriiKok/grafana, чтобы была предсказуемая структура данных.
2. Установлена nodejs, проверьте node -v и npm -v.

## Подготовка
1. Создайте API ключ для взаимодействия с Grafana. Для этого перейдите в боковом меню Grafana слева в раздел Configuration - API Keys, далее Add API key, укажите имя, роль Admin и время достаточное, чтобы долго не вспоминать об этом. Сохраните ключ, позднее вам понадобится ввести его один раз, потом скрипт запишет его в .profile для дальнейшей работы с виджетом.
2. Вам понадобится UID вашего текущего дашборда. Если вы сейчас смотрите на виджет мониторинга серверов, то UID здесь: <br/>
 ![image](https://github.com/user-attachments/assets/493b0e11-05ba-4593-a6e3-e1b1c408238c)

## Добавляем новый виджет в Grafana
Потребуется указать API ключ, UID дашборда и адрес сервера в формате XX.XX.XX.XX, на котором стоит Grafana:

	bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Add_panel/add_new_panel.sh)

Готово, добавляйте проекты в мониторинг с этого же сервера, чтобы не вводить каждый раз ключ, адрес и uid.


## Добавляем проекты в мониторинг
Каждый скрипт этого раздела выполнит следующие задачи:
- установит необходимые npm пакеты
- сохранит в папке /root/Grafana_node_checker скрипт-чекер для необходимой ноды
- добавит в cron расписание на ежеминутное выполнение скрипта-чекера
- скрипт-чекер создаст файл с метрикой в папке /var/lib/prometheus/node-exporter и при каждом выполнении по расписанию обновит значения метрики
- пропишет в сервисник Node exporter запуск с ключом, который укажет на необходимость добавить новую метрику из папки /var/lib/prometheus/node-exporter в общий список метрик


### Waku

Проверка healthcheck

	bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Waku/waku_health_check.sh)


Результат: наша метрика уже доступна для Grafana, но пока она ничего про метрику не знает. Проверить можно поиском слова waku_health_checker по списку метрик на http://SERVER_IP:9100/metrics



## 3.	Добавляем колонку с проектом в виджет мониторинга нод
1. Заходим в настройки виджета <br/>
   ![image](https://github.com/user-attachments/assets/4d7b64b3-7e51-4613-a004-145092c38040)
2. В открывшемся разделе Queries смотрим, чтобы в поле Query был выбран Prometheus.
3. Если делаем первый раз, то в блоке A в поле Metrics указываем waku_health_checker, Format - Table, Instant - ON. Если добавляем не первую ноду, то Add query и заполняем.
4. Переходим в боковое меню Visualization, внизу Add column style. В добавленном блоке кликаем в инпут Apply to columns named и выбираем Value, Column Header - Waku, Type - String, кликаем плюсик в Value Mappings Type дважды, добавляем для значения 1 - Fine, 0 - Fail. Thresholds - 0,1, Color Mode - Cell.

Важно. Если добавляем второй, то в первом блоке значение Value изменится на Value A, нужно будет изменить значение в Apply to columns named.
