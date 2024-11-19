## 1.	Добавляем чекер ноды на сервер
Предусловие: 
1. Установлена Nodejs и работаем из-под рута.
2. Установлена Grafana, желательно по моему гайду https://github.com/AndriiKok/grafana, чтобы была предсказуемая структура.
   
На сервер с нодой, которую хотим мониторить, устанавливаем всё необходимое. Скрипт попросит ввести только название проекта, например, waku. Советую указать маленькими буквами без пробелов и спецсимволов.

	source .profile && bash <(curl -s https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/add_new_node.sh)

Что сделал скрипт:
- установил необходимые npm пакеты
- создал папку /root/Grafana_node_checker и в ней сохранил скрипт-чекер для необходимой ноды
- добавил в cron расписание на ежеминутное выполнение скрипта-чекера
- скрипт-чекер создаёт файл с метрикой в папке /var/lib/prometheus/node-exporter и при каждом выполнении по расписанию обновляет значения метрики
- прописал в сервисник Node exporter запуск с ключом, который указывает на необходимость добавить нашу новую метрику из папки /var/lib/prometheus/node-exporter в общий список метрик, рестарт демона и сервиса

Результат: наша метрика уже доступна для Grafana, но пока она ничего про метрику не знает. Проверить можно поиском слова waku_health_checker по списку метрик на http://SERVER_IP:9100/metrics

## 2.	Добавляем новый виджет в Grafana
Этот шаг пропускаем, если виджет для мониторинга нод уже ставил раньше.
Иначе открываем Dashboard settings и в разделе JSOM Model вставляем весь текст из файла:

    https://github.com/AndriiKok/grafana-node-checker/blob/main/json_model_with_new_widget.json

Сохраняем. Новый виджет добавится над виджетом мониторинга серверов.

## 3.	Добавляем колонку с проектом в виджет мониторинга нод
1. Заходим в настройки виджета <br/>
   ![image](https://github.com/user-attachments/assets/4d7b64b3-7e51-4613-a004-145092c38040)
2. В открывшемся разделе Queries смотрим, чтобы в поле Query был выбран Prometheus.
3. Если делаем первый раз, то в блоке A в поле Metrics указываем waku_health_checker, Format - Table, Instant - ON. Если добавляем не первую ноду, то Add query и заполняем.
4. Переходим в боковое меню Visualization, внизу Add column style. В добавленном блоке кликаем в инпут Apply to columns named и выбираем Value, Column Header - Waku, Type - String, кликаем плюсик в Value Mappings Type дважды, добавляем для значения 1 - Fine, 0 - Fail. Thresholds - 0,1, Color Mode - Cell.

Важно. Если добавляем второй, то в первом блоке значение Value изменится на Value A, нужно будет изменить значение в Apply to columns named.
