const fs = require('fs');
const { exec } = require('child_process');
const client = require('prom-client');
const https = require('https');

const nodeHealthMetric = new client.Gauge({
  name: 'nesa_response_1h_diff_check',
  help: 'Nesa response checker'
});

const writeMetricsToFile = async () => {
  const metrics = await client.register.metrics();
  fs.writeFileSync('/var/lib/prometheus/node-exporter/nesa_response_1h_diff_check.prom', metrics);
  console.log('Metrics written to file: /var/lib/prometheus/node-exporter/nesa_response_1h_diff_check.prom');
};

const getNodeID = async () => {
  return new Promise((resolve, reject) => {
    fs.readFile('/root/.nesa/identity/node_id.id', 'utf8', (error, data) => {
      if (error) {
        console.error(`Error reading file: ${error}`);
        return reject(error);
      }
      const node_id = data.trim();
      resolve(node_id);
    });
  });
};

const fetchDataFromAPI = async (node_id) => {
  return new Promise((resolve, reject) => {
    const url = `https://api-test.nesa.ai/nodes/${node_id}/stat`;
    https.get(url, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        try {
          const responseCount = JSON.parse(data).responseCount;

          // Проверяем существование файла
          fs.access('/root/Grafana_node_checker/nesa_response_count.txt', fs.constants.F_OK, (err) => {
            if (err) {
              // Файл не существует
              fs.writeFileSync('/root/Grafana_node_checker/nesa_response_count.txt', responseCount.toString());
              resolve('0');
            } else {
              // Файл существует
              const previousResponseCount = parseInt(fs.readFileSync('/root/Grafana_node_checker/nesa_response_count.txt', 'utf8'), 10);
              const difference = responseCount - previousResponseCount;

              // Обновляем файл новым значением
              fs.writeFileSync('/root/Grafana_node_checker/nesa_response_count.txt', responseCount.toString());
              resolve(difference.toString());
            }
          });
        } catch (e) {
          console.error('Error parsing JSON:', e);
          resolve('0'); // Возвращаем '0', если ошибка парсинга JSON
        }
      });

    }).on("error", (err) => {
      console.error(`Error fetching data from API: ${err.message}`);
      resolve('0'); // Возвращаем '0' в случае ошибки запроса
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
