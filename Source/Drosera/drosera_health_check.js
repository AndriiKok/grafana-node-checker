const fs = require('fs');
const { exec } = require('child_process');
const client = require('prom-client');

const nodeHealthMetric = new client.Gauge({
  name: 'drosera_health_check',
  help: 'Drosera health checker'
});

const writeMetricsToFile = async () => {
  const metrics = await client.register.metrics();
  fs.writeFileSync('/var/lib/prometheus/node-exporter/drosera_health_check.prom', metrics);
  console.log('Metrics written to file: /var/lib/prometheus/node-exporter/drosera_health_check.prom');
};

const checkHealth = async () => {
  exec(`curl --location "http://$(curl -s ipv4.icanhazip.com):31314" --header 'Content-Type: application/json' --data '{"jsonrpc":"2.0","method":"drosera_healthCheck","params":[],"id":1}'`, 
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error}`);
      nodeHealthMetric.set(0);
      console.log('Node health status: Not OK (Error executing script)');
    } else if (stdout.includes('true')) {
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
