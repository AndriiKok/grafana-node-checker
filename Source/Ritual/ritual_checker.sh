#!/bin/bash

# Устанавливаем screen, если он не установлен
if ! command -v screen &> /dev/null
then
    echo "Устанавливаем screen..."
    sudo apt update && sudo apt install -y screen
fi

# Имя screen-сессии
SESSION_NAME="ritual_checker"

# Создаём screen-сессию и запускаем скрипт в ней
screen -dmS $SESSION_NAME bash -c "curl -sSL https://raw.githubusercontent.com/AndriiKok/grafana-node-checker/refs/heads/main/Source/Ritual/ritual_checker.js -o ritual_checker.js && node ritual_checker.js"

echo "Скрипт запущен в screen-сессии: $SESSION_NAME"
