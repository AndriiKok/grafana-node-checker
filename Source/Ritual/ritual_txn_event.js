const fs = require('fs');
const axios = require('axios');
const ethers = require('ethers');
const client = require('prom-client');

// Создание метрики
const transactionAgeMetric = new client.Gauge({
  name: 'ritual_txn_event',
  help: 'Number of days since the last transaction'
});

// Функция записи метрик в файл
const writeMetricsToFile = async () => {
  try {
    const metrics = await client.register.metrics();
    console.log('Metrics generated:', metrics);

    const filePath = '/var/lib/prometheus/node-exporter/ritual_txn_event.prom';
    fs.writeFileSync(filePath, metrics);
    console.log(`Metrics written successfully to: ${filePath}`);
  } catch (error) {
    console.error('Error writing metrics:', error);
  }
};

// Получаем текущий timestamp
const currentTimestamp = Math.floor(Date.now() / 1000);

// Вычисляем timestamp семь дней назад
const oldTimestamp = currentTimestamp - 7 * 24 * 60 * 60;

// Запрашиваем старый блок
const oldBlockUrl = `https://base.blockscout.com/api?module=block&action=getblocknobytime&timestamp=${oldTimestamp}&closest=after`;

axios.get(oldBlockUrl).then(response => {
  const oldBlock = response.data.result?.blockNumber || null;

  if (!oldBlock) {
    console.error("Не удалось получить старый блок.");
    process.exit(1);
  }

  console.log(`Old Block: ${oldBlock}`);

  // Запрашиваем список транзакций
  const txListUrl = `https://base.blockscout.com/api?module=account&action=txlist&address=my_address&startblock=${oldBlock}&page=1&offset=1&sort=desc`;

  axios.get(txListUrl).then(async response => {
    const result = response.data.result;

    let daysAgo = 8; // По умолчанию, если нет транзакций
    if (result.length > 0 && result[0].timeStamp) {
      const txTimestamp = parseInt(result[0].timeStamp, 10);
      daysAgo = Math.floor((currentTimestamp - txTimestamp) / (24 * 60 * 60)) + 1;
    }

    console.log(`Transaction Age (Days Ago): ${daysAgo}`);
    transactionAgeMetric.set(daysAgo); // Записываем значение метрики

    await writeMetricsToFile(); // Записываем метрики в файл
  }).catch(error => {
    console.error("Ошибка запроса транзакций:", error);
    process.exit(1);
  });

}).catch(error => {
  console.error("Ошибка запроса блока:", error);
  process.exit(1);
});
