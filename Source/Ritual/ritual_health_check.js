const fs = require('fs');
const { exec } = require('child_process');
const client = require('prom-client');

const nodeHealthMetric = new client.Gauge({
  name: 'ritual_health_check',
  help: 'Ritual health checker'
});

const writeMetricsToFile = async () => {
  const metrics = await client.register.metrics();
  fs.writeFileSync('/var/lib/prometheus/node-exporter/ritual_health_check.prom', metrics);
  console.log('Metrics written to file: /var/lib/prometheus/node-exporter/ritual_health_check.prom');
};

const checkHealth = async () => {
  exec('curl 0.0.0.0:4321/health', 
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error}`);
      nodeHealthMetric.set(0);
      console.log('Node health status: Not OK (Error executing script)');
    } else if (stdout.includes('healthy')) {
      nodeHealthMetric.set(1);
      console.log('Node health status: OK');
    } else {
      nodeHealthMetric.set(0);
      console.log('Node health status: Not OK');
    }
    writeMetricsToFile();
  });
};

checkHealth();
