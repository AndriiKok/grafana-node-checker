const fs = require('fs');
const { exec } = require('child_process');
const client = require('prom-client');

const nodeHealthMetric = new client.Gauge({
  name: '${file_name}',
  help: '${project} health status'
});

const writeMetricsToFile = async () => {
  const metrics = await client.register.metrics();
  fs.writeFileSync('/var/lib/prometheus/node-exporter/${file_name}.prom', metrics);
  console.log('Metrics written to file: /var/lib/prometheus/node-exporter/${file_name}.prom');
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
