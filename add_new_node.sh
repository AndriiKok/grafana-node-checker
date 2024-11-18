read -p "Введите название проекта, который нужно добавить: " project
mkdir -p /root/Grafana_node_checker

# Создаём файл со скриптом проверки ноды
sudo tee /root/Grafana_node_checker/${project}_health_checker.js > /dev/null <<EOF
const fs = require('fs');
const { exec } = require('child_process');
const client = require('prom-client');

const nodeHealthMetric = new client.Gauge({
  name: '${project}_health_status',
  help: '${project} health status'
});

const writeMetricsToFile = async () => {
  const metrics = await client.register.metrics();
  fs.writeFileSync('/var/lib/prometheus/node-exporter/${project}_health_metrics.prom', metrics);
  console.log('Metrics written to file: /var/lib/prometheus/node-exporter/${project}_health_metrics.prom');
};

const checkHealth = async () => {
  exec('$HOME/dill/health_check.sh', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error}`);
      nodeHealthMetric.set(0);
      console.log('Node health status: Not Ready (Error executing script)');
    } else if (stdout.includes('node not running')) {
      nodeHealthMetric.set(0);
      console.log('Node health status: Not Ready (node not running)');
    } else {
      nodeHealthMetric.set(1);
      console.log('Node health status: Ready');
    }
    writeMetricsToFile();
  });
};

checkHealth();

EOF


# Добавляем файл в крон с частотой выполнения каждую минуту
cron_entry="* * * * * $(which node) /root/Grafana_node_checker/${project}_health_checker.js"
sudo crontab -l | { cat; echo "$cron_entry"; } | sudo crontab -
