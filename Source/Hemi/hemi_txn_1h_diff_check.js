const fs = require('fs');
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

const main = async () => {
  try {
    const node_id = 'your_node_id_here'; // Укажите ваш node_id здесь
    const status = await fetchDataFromAPI(node_id);
    nodeHealthMetric.set(parseFloat(status));
    await writeMetricsToFile();
  } catch (error) {
    console.error(`Error in main execution: ${error.message}`);
  }
};

main();
