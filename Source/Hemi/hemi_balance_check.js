const fs = require('fs');
const { exec } = require('child_process');
const client = require('prom-client');
const https = require('https');

const nodeBalanceMetric = new client.Gauge({
  name: 'hemi_balance_check',
  help: 'Hemi balance checker'
});

const writeMetricsToFile = async () => {
  const metrics = await client.register.metrics();
  fs.writeFileSync('/var/lib/prometheus/node-exporter/hemi_balance_check.prom', metrics);
  console.log('Metrics written to file: /var/lib/prometheus/node-exporter/hemi_balance_check.prom');
};

const checkBalance = async () => {
  const url = `https://mempool.space/testnet/api/address/mgkhjZSVqgc1csfm2pF8NHgXixhEHVoh1G`;
  
  https.get(url, (resp) => {
    let data = '';

    // Получаем данные по частям
    resp.on('data', (chunk) => {
      data += chunk;
    });

    // Вся информация получена
    resp.on('end', () => {
      try {
        const response = JSON.parse(data);
        const chainBalance = response.chain_stats.funded_txo_sum - response.chain_stats.spent_txo_sum;
        const mempoolBalance = response.mempool_stats.funded_txo_sum - response.mempool_stats.spent_txo_sum;
        const totalBalance = (chainBalance + mempoolBalance) / 100000000;
        
        nodeBalanceMetric.set(totalBalance);
        console.log(`Current balance for address mgkhjZSVqgc1csfm2pF8NHgXixhEHVoh1G: ${totalBalance}`);
      } catch (parseError) {
        console.error(`Error parsing response: ${parseError}`);
        nodeBalanceMetric.set(0);
        console.log('Error parsing response');
      }
      writeMetricsToFile();
    });

  }).on("error", (err) => {
    console.error(`Error fetching data from API: ${err.message}`);
    nodeBalanceMetric.set(0);
    writeMetricsToFile();
  });
};

checkBalance();
