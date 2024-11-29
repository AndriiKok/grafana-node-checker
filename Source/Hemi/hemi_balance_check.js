const fs = require('fs');
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

const checkBalance = async (node_id) => {
  const url = `https://mempool.space/testnet/api/address/${node_id}`;
  
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
        console.log(`Текущий баланс для адреса ${node_id}: ${totalBalance}`);
      } catch (parseError) {
        console.error(`Ошибка при парсинге ответа: ${parseError}`);
        nodeBalanceMetric.set(0);
        console.log('Ошибка при парсинге ответа');
      }
      writeMetricsToFile();
    });

  }).on("error", (err) => {
    console.error(`Ошибка при запросе данных с API: ${err.message}`);
    nodeBalanceMetric.set(0);
    writeMetricsToFile();
  });
};

const main = async () => {
  try {
    const node_id = 'your_node_id_here'; // Укажите ваш node_id здесь
    await checkBalance(node_id);
    await writeMetricsToFile();
  } catch (error) {
    console.error(`Ошибка в основной функции: ${error.message}`);
  }
};

main();
