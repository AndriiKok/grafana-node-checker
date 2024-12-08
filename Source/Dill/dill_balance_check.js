const axios = require('axios');
const client = require('prom-client');
const fs = require('fs');

// Функция для перевода Wei в Gwei (делим на 1e9)
const weiToGwei = (wei) => {
  return wei / 1e9;
}

const fetchValidatorByPubkey = async (pubkey) => {
  try {
    const response = await axios.get('https://alps.dill.xyz/api/trpc/stats.getAllValidators');
    const validators = response.data.result.data.json.data;
    const validator = validators.find(v => v.validator.pubkey === pubkey);
    return validator ? validator.balance : null;
  } catch (error) {
    console.error('Error fetching validator data:', error);
    return null;
  }
};

const pubkey = '0xPUB_KEY';

fetchValidatorByPubkey(pubkey).then(balance => {
  if (balance !== null) {
    let balanceInGwei = weiToGwei(balance);
    balanceInGwei = balanceInGwei.toFixed(0); // Округляем до одного знака после запятой
    console.log(`Balance for pubkey ${pubkey}: ${balanceInGwei} Gwei`);
    
    // Создание метрики
    const nodeHealthMetric = new client.Gauge({
      name: 'dill_balance_check',
      help: 'Dill balance checker'
    });

    // Установка значения метрики
    nodeHealthMetric.set(parseFloat(balanceInGwei)); // Преобразуем строку обратно в число

    // Запись метрик в файл
    const writeMetricsToFile = async () => {
      const metrics = await client.register.metrics();
      fs.writeFileSync('/var/lib/prometheus/node-exporter/dill_balance_check.prom', metrics);
      console.log('Metrics written to file: /var/lib/prometheus/node-exporter/dill_balance_check.prom');
    };

    writeMetricsToFile();
  } else {
    console.log(`Validator with pubkey ${pubkey} not found`);
  }
});
