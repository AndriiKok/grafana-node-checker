const fs = require('fs');
const { exec } = require('child_process');
const client = require('prom-client');
const https = require('https');

const nodeHealthMetric = new client.Gauge({
  name: 'nesa_status_check',
  help: 'Nesa health checker'
});

const writeMetricsToFile = async () => {
  const metrics = await client.register.metrics();
  fs.writeFileSync('/var/lib/prometheus/node-exporter/nesa_status_check.prom', metrics);
  console.log('Metrics written to file: /var/lib/prometheus/node-exporter/nesa_status_check.prom');
};

const getNodeID = async () => {
  return new Promise((resolve, reject) => {
    exec("docker logs orchestrator 2>&1 | grep 'Node ID:' | awk -F': ' '{print $2}' | head -n 1", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error}`);
        return reject(error);
      }
      const node_id = stdout.trim();
      resolve(node_id);
    });
  });
};

const fetchDataFromAPI = async (node_id) => {
  return new Promise((resolve, reject) => {
    const url = `https://api-test.nesa.ai/nodes/${node_id}/general`;
    https.get(url, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        try {
          const status = JSON.parse(data).node.status;
          resolve(status.toString());
        } catch (e) {
          console.error('Error parsing JSON:', e);
          resolve('0'); // Возвращаем '0', если ошибка парсинга JSON
        }
      });

    }).on("error", (err) => {
      console.error(`Error fetching data from API: ${err.message}`);
      reject(err);
    });
  });
};

const main = async () => {
  try {
    const node_id = await getNodeID();
    const status = await fetchDataFromAPI(node_id);
    nodeHealthMetric.set(parseFloat(status)); // Устанавливаем значение метрики
    await writeMetricsToFile();
  } catch (error) {
    console.error(`Error in main execution: ${error.message}`);
  }
};

main();
