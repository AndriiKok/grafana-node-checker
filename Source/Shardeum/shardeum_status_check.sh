#!/bin/bash
#thanks for https://raw.githubusercontent.com/ipohosov/public-node-scripts/main/shardeum/shardeum_healthcheck.sh

function get_status() {
    STATUS=$(docker exec -it shardeum-dashboard operator-cli status | grep status | awk -F': ' '{print $2}')
    echo "${STATUS}"
}

cd "$HOME" || exit

printf "Check shardeum node status \n"
NODE_STATUS=$(get_status)
printf "Current status: ${NODE_STATUS}\n"

if [ -z "$NODE_STATUS" ]; then
    echo "Shardeum нода не запущена"
    docker start shardeum-dashboard
    node_status=0
else
    case "${NODE_STATUS}" in
        *"Waiting-For-Network"*)
            echo "Status is Waiting-For-Network"
            node_status=1
            ;;
        *"standby"*)
            echo "Status is Standby"
            node_status=2
            ;;
        *"validating"*)
            echo "Status is Validating"
            node_status=3
            ;;
        *)
            echo "Status is unknown or error"
            node_status=0
            ;;
    esac
fi

# Create the file if it doesn't exist and write the status
PROM_FILE="/var/lib/prometheus/node-exporter/shardeum_status.prom"
mkdir -p $(dirname "$PROM_FILE")
cat << EOF > "$PROM_FILE"
# HELP shardeum_status Shardeum status checker
# TYPE shardeum_status gauge
shardeum_status $node_status
EOF

echo "Metrics written to file: $PROM_FILE"
