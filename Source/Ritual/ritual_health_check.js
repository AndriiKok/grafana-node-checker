const fs = require('fs');
const util = require('util');
const { exec } = require('child_process');
const client = require('prom-client');

const execAsync = util.promisify(exec);

// Создание метрики
const nodeHealthMetric = new client.Gauge({
  name: 'ritual_health_check',
  help: 'Ritual health checker'
});

// Функция записи метрик в файл с обработкой ошибок
const writeMetricsToFile = async () => {
  try {
    const metrics = await client.register.metrics();
    console.log('Metrics generated:', metrics);

    const filePath = '/var/lib/prometheus/node-exporter/ritual_health_check.prom';
    fs.writeFileSync(filePath, metrics);
    console.log(`Metrics written successfully to: ${filePath}`);
  } catch (error) {
    console.error('Error writing metrics:', error);
  }
};

// Функция проверки состояния узла
const checkHealth = async () => {
  try {
    const { stdout } = await execAsync('curl 0.0.0.0:4321/health');

    if (stdout.includes('healthy')) {
      nodeHealthMetric.set(1);
      console.log('Node health status: OK');
    } else {
      nodeHealthMetric.set(0);
      console.log('Node health status: Not OK');
    }
  } catch (error) {
    console.error(`Error executing health check: ${error}`);
    nodeHealthMetric.set(0);
    console.log('Node health status: Not OK (Error executing script)');
  }

  // Гарантированная запись метрик после проверки
  await writeMetricsToFile();
};

// Запуск функции
checkHealth();
