read -p "Введите название проекта, который нужно добавить: " project
file_name="${project}_health_checker"

mkdir -p /root/Grafana_node_checker
source .profile
sudo apt-get update
npm install prom-client fs child_process

# Создаём файл со скриптом проверки ноды
sudo tee /root/Grafana_node_checker/$file_name.js >/dev/null <<EOF
const fs = require('fs');
const { exec } = require('child_process');
const client = require('prom-client');

const nodeHealthMetric = new client.Gauge({
  name: '$file_name',
  help: '$project health status'
});

const writeMetricsToFile = async () => {
  const metrics = await client.register.metrics();
  fs.writeFileSync('/var/lib/prometheus/node-exporter/$file_name.prom', metrics);
  console.log('Metrics written to file: /var/lib/prometheus/node-exporter/$file_name.prom');
};

const checkHealth = async () => {
  exec('curl -X GET http://localhost:8645/health', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error}`);
      nodeHealthMetric.set(0);
      console.log('Node health status: Not Ready (Error executing script)');
    } else if (stdout.includes('Ready')) {
      nodeHealthMetric.set(1);
      console.log('Node health status: Ready');
    } else {
      nodeHealthMetric.set(0);
      console.log('Node health status: Not Ready');
    }
    writeMetricsToFile();
  });
};

checkHealth();
EOF

# Получаем абсолютный путь к node
node_path=$(which node)

# Добавляем файл в крон с частотой выполнения каждую минуту
source .profile
cron_entry="* * * * * $node_path /root/Grafana_node_checker/$file_name.js"
sudo crontab -l | { cat; echo "$cron_entry"; } | sudo crontab -

# Добавляем в сервисник Node Exporter ключ для запуска сервиса с папкой с новой метрикой
if ! grep -q -- "--collector" /lib/systemd/system/prometheus-node-exporter.service; then
  sudo sed -i 's|ExecStart=/usr/bin/prometheus-node-exporter $ARGS|ExecStart=/usr/bin/prometheus-node-exporter $ARGS --collector.textfile.directory=/var/lib/prometheus/node-exporter/|' /lib/systemd/system/prometheus-node-exporter.service
  sudo systemctl daemon-reload
  sudo systemctl restart prometheus-node-exporter
fi
