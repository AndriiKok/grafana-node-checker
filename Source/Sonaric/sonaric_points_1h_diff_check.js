const fs = require('fs');
const { exec } = require('child_process');
const client = require('prom-client');
const https = require('https');

const nodeHealthMetric = new client.Gauge({
  name: 'sonaric_points_1h_diff_check',
  help: 'Sonaric points checker'
});

const writeMetricsToFile = async () => {
  const metrics = await client.register.metrics();
  fs.writeFileSync('/var/lib/prometheus/node-exporter/sonaric_points_1h_diff_check.prom', metrics);
  console.log('Metrics written to file: /var/lib/prometheus/node-exporter/sonaric_points_1h_diff_check.prom');
};

const getNodeID = async () => {
  return new Promise((resolve, reject) => {
    fs.readFile('/var/lib/sonaricd/sonaric.conf', 'utf8', (error, data) => {
      if (error) {
        console.error(`Error reading file: ${error}`);
        return reject(error);
      }
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.PeerID) {
          resolve(jsonData.PeerID);
        } else {
          reject(new Error('PeerID not found in configuration file'));
        }
      } catch (parseError) {
        console.error(`Error parsing JSON: ${parseError}`);
        reject(parseError);
      }
    });
  });
};

const fetchDataFromAPI = async (peerID) => {
  return new Promise((resolve, reject) => {
    const url = `https://api.sonaric.xyz/telemetry/v1/clusters?query=${peerID}`;
    https.get(url, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        try {
          const jsonResponse = JSON.parse(data);
          console.log('API Response:', JSON.stringify(jsonResponse, null, 2));

          if (jsonResponse.items && jsonResponse.items.length > 0) {
            const points = jsonResponse.items[0].points;

            // Проверяем существование файла
            fs.access('/root/Grafana_node_checker/sonaric_points_1h_diff_check.txt', fs.constants.F_OK, (err) => {
              if (err) {
                // Файл не существует
                fs.writeFileSync('/root/Grafana_node_checker/sonaric_points_1h_diff_check.txt', points.toString());
                resolve('0');
              } else {
                // Файл существует
                const previousResponseCount = parseFloat(fs.readFileSync('/root/Grafana_node_checker/sonaric_points_1h_diff_check.txt', 'utf8'));
                const difference = points - previousResponseCount;

                // Обновляем файл новым значением
                fs.writeFileSync('/root/Grafana_node_checker/sonaric_points_1h_diff_check.txt', points.toString());
                resolve(difference.toString());
              }
            });
          } else {
            console.error('API returned empty items array');
            resolve('0');
          }
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
    const peerID = await getNodeID();
    const status = await fetchDataFromAPI(peerID);
    nodeHealthMetric.set(parseFloat(status)); // Устанавливаем значение метрики
    await writeMetricsToFile();
  } catch (error) {
    console.error(`Error in main execution: ${error.message}`);
  }
};

main();
