read -p "Введите название проекта, который нужно добавить: " project
mkdir /root/Grafana_node_checker
# cd /root/Grafana_node_checker && touch $project_health_checker.js

sudo tee <<EOF >/dev/null /root/Grafana_node_checker/$project_health_checker.js
global:
  scrape_interval:     15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'Nodes'
    scrape_interval: 30s
    static_configs:
      
      - targets:
          - '$(curl -s ipv4.icanhazip.com):9100'
        labels:
          instance: '$(curl -s ipv4.icanhazip.com)'
          nodename: 'MainServer'
EOF
