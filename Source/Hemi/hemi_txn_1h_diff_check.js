const fs = require('fs');
const { exec } = require('child_process');
const client = require('prom-client');
const https = require('https');

const nodeHealthMetric = new client.Gauge({
  name: 'hemi_txn_1h_diff_check',
  help: 'Hemi txn checker'
});

const writeMetricsToFile = async () => {
  const metrics = await client.register.metrics();
  fs.writeFileSync('/var/lib/prometheus/node-exporter/hemi_txn_1h_diff_check.prom', metrics);
  console.log('Metrics written to file: /var/lib/prometheus/node-exporter/hemi_txn_1h_diff_check.prom');
};

const fetchDataFromAPI = async () => {
  return new Promise((resolve, reject) => {
    const url = 'https://mempool.space/testnet/api/address/mgkhjZSVqgc1csfm2pF8NHgXixhEHVoh1G';
    https.get(url, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        try {
          const jsonResponse = JSON.parse(data);
          console.log('API Response:', JSON.stringify(jsonResponse, null, 2));

          if (jsonResponse.chain_stats) {
            const txCount = jsonResponse.chain_stats.tx_count;

            // Проверяем существование файла
            fs.access('/root/Grafana_node_checker/hemi_txn_1h_diff_check.txt', fs.constants.F_OK, (err) => {
              if (err) {
                // Файл не существует
                fs.writeFileSync('/root/Grafana_node_checker/hemi_txn_1h_diff_check.txt', txCount.toString());
                resolve('0');
              } else {
                // Файл существует
                const previousTxCount = parseInt(fs.readFileSync('/root/Grafana_node_checker/hemi_txn_1h_diff_check.txt', 'utf8'), 10);
                const difference = txCount - previousTxCount;

                // Обновляем файл новым значением
                fs.writeFileSync('/root/Grafana_node_checker/hemi_txn_1h_diff_check.txt', txCount.toString());
                resolve(difference.toString());
              }
            });
          } else {
            console.error('API returned invalid data');
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
    const status = await fetchDataFromAPI();
    nodeHealthMetric.set(parseFloat(status)); // Устанавливаем значение метрики
    await writeMetricsToFile();
  } catch (error) {
    console.error(`Error in main execution: ${error.message}`);
  }
};

main();
