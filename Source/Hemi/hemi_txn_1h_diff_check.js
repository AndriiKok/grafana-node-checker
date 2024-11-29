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

const fetchDataFromAPI = async (node_id) => {
  return new Promise((resolve, reject) => {
    const url = `https://mempool.space/testnet/api/address/${node_id}`;
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

            fs.access('/root/Grafana_node_checker/hemi_txn_1h_diff_check.txt', fs.constants.F_OK, (err) => {
              if (err) {
                fs.writeFileSync('/root/Grafana_node_checker/hemi_txn_1h_diff_check.txt', txCount.toString());
                resolve('0');
              } else {
                const previousTxCount = parseInt(fs.readFileSync('/root/Grafana_node_checker/hemi_txn_1h_diff_check.txt', 'utf8'), 10);
                const difference = txCount - previousTxCount;

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
          resolve('0');
        }
      });

    }).on("error", (err) => {
      console.error(`Error fetching data from API: ${err.message}`);
      resolve('0');
    });
  });
};

const getNodeID = async () => {
  return new Promise((resolve, reject) => {
    const profilePath = `${process.env.HOME}/.profile`;
    fs.readFile(profilePath, 'utf8', (err, data) => {
      if (err || !data.includes('node_id=')) {
        // Перезапускаем службу hemi и ждем 10 секунд
        exec("sudo systemctl restart hemi", (err) => {
          if (err) {
            console.error(`Ошибка при перезапуске службы hemi: ${err.message}`);
            return resolve(null);
          }

          setTimeout(() => {
            // Выполняем команду для получения node_id
            exec("journalctl -n 50 -u hemi -o cat | grep -oP '(?<=address )[^\s]+' | cut -d ' ' -f 1", (err, stdout, stderr) => {
              if (err) {
                console.error(`Ошибка при получении node_id: ${err.message}`);
                return resolve(null);
              }

              // Подождем 5 секунд перед продолжением
              setTimeout(() => {
                // Разделяем stdout по строкам и берем последнее значение
                const node_ids = stdout.trim().split('\n');
                const node_id = node_ids[node_ids.length - 1];

                // Записываем node_id в .profile
                fs.appendFileSync(profilePath, `\nnode_id=${node_id}`);
                resolve(node_id);
              }, 5000); // Ждем 5 секунд
            });
          }, 10000); // Ждем 10 секунд
        });
      } else {
        const node_id = data.match(/node_id=([^\n]+)/)[1];
        resolve(node_id);
      }
    });
  });
};




const main = async () => {
  try {
    const node_id = await getNodeID();
    if (node_id) {
      const status = await fetchDataFromAPI(node_id);
      nodeHealthMetric.set(parseFloat(status));
      await writeMetricsToFile();
    } else {
      console.error('Failed to retrieve node_id');
    }
  } catch (error) {
    console.error(`Error in main execution: ${error.message}`);
  }
};

main();
