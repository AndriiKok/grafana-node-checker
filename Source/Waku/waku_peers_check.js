const fs = require('fs');
const { exec } = require('child_process');
const client = require('prom-client');

const nodeHealthMetric = new client.Gauge({
  name: 'waku_peers_check',
  help: 'Waku peers checker'
});

const writeMetricsToFile = async () => {
  const metrics = await client.register.metrics();
  fs.writeFileSync('/var/lib/prometheus/node-exporter/waku_peers_check.prom', metrics);
  console.log('Metrics written to file: /var/lib/prometheus/node-exporter/waku_peers_check.prom');
};

const checkHealth = async () => {
  exec('curl -X GET http://localhost:8645/admin/v1/peers', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error}`);
      nodeHealthMetric.set(0);
      console.log('Error executing script');
    } else {
      try {
        const peers = JSON.parse(stdout);
        const connectedPeers = peers.filter(peer => 
          peer.protocols.some(protocol => protocol.connected === true)
        ).length;
        nodeHealthMetric.set(connectedPeers);
        console.log(`Number of connected peers: ${connectedPeers}`);
      } catch (parseError) {
        console.error(`Error parsing response: ${parseError}`);
        nodeHealthMetric.set(0);
        console.log('Error parsing response');
      }
    }
    writeMetricsToFile();
  });
};

checkHealth();
