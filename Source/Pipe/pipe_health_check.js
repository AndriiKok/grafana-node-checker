const fs = require('fs');
const util = require('util');
const { exec } = require('child_process');
const client = require('prom-client');

const execAsync = util.promisify(exec);

// Создание метрики
const nodeHealthMetric = new client.Gauge({
  name: 'pipe_health_check',
  help: 'Pipe health checker'
});

// Функция записи метрик в файл с обработкой ошибок
const writeMetricsToFile = async () => {
  try {
    const metrics = await client.register.metrics();
    console.log('Metrics generated:', metrics);

    const filePath = '/var/lib/prometheus/node-exporter/pipe_health_check.prom';
    fs.writeFileSync(filePath, metrics);
    console.log(`Metrics written successfully to: ${filePath}`);
  } catch (error) {
    console.error('Error writing metrics:', error);
  }
};

// Функция проверки состояния узла
const checkHealth = async () => {
  try {
    // Выполняем команду curl и jq для получения JSON статуса
    const { stdout } = await execAsync('curl http://localhost/health | jq');

    console.log('Health check raw output:', stdout);

    // Парсим JSON вывод
    const healthStatus = JSON.parse(stdout);

    // Проверяем значение поля "status"
    if (healthStatus && healthStatus.status === 'ok') {
      nodeHealthMetric.set(1);
      console.log('Node health status: OK');
    } else {
      nodeHealthMetric.set(0);
      console.log('Node health status: Not OK');
    }
  } catch (error) {
    console.error(`Error executing health check or parsing JSON: ${error}`);
    nodeHealthMetric.set(0);
    console.log('Node health status: Not OK (Error executing script or parsing output)');
  }

  // Гарантированная запись метрик после проверки
  await writeMetricsToFile();
};

// Запуск функции
checkHealth();
