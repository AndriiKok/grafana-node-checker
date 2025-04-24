const { exec } = require("child_process");

let counter = 0;

function checkHealth() {
    exec("curl -s 0.0.0.0:4321/health", (error, stdout) => {
        if (error) {
            console.error(`Ошибка при выполнении curl: ${error.message}`);
            return;
        }

        if (stdout.includes("healthy")) {
            console.log("Всё работает хорошо");
            counter = 0;
        } else {
            counter++;
            if (counter >= 10) {
                console.log("Достигнуто значение 10. Перезапускаем контейнер...");
                exec("docker compose -f $HOME/infernet-container-starter/deploy/docker-compose.yaml restart", (err) => {
                    if (err) {
                        console.error(`Ошибка при перезапуске контейнера: ${err.message}`);
                    } else {
                        console.log("Контейнер успешно перезапущен.");
                    }
                });
                counter = 0;
            } else {
                console.log(`Текущее значение счётчика: ${counter}`);
            }
        }
    });
}

// Запускаем проверку каждую минуту
setInterval(checkHealth, 60000);
