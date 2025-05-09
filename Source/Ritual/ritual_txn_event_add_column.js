const axios = require('axios');

const apiUrl = 'http://server_ip:3002/api/dashboards/uid';
const apiKey = 'api_key';
const dashboardUid = 'dash_uid';
const panelId = panel_uid;

const newStyle = {
  alias: "Ritual txn, 1h",
  colorMode: "cell",
  colors: [
    "rgba(50, 172, 45, 0.97)",
    "rgba(237, 129, 40, 0.89)",
    "rgba(245, 54, 54, 0.9)"
  ],
  dateFormat: "YYYY-MM-DD HH:mm:ss",
  decimals: 2,
  mappingType: 1,
  pattern: "Value #X",
  thresholds: [
    "3.5",
    "7.5"
  ],
  type: "string",
  unit: "short",
  valueMaps: [
    {
      text: "Today",
      value: "1"
    },
    {
      text: "~2d",
      value: "2"
    },
    {
      text: "~3d",
      value: "3"
    },
    {
      text: "~4d",
      value: "4"
    },
    {
      text: "O~5dK",
      value: "5"
    },
    {
      text: "~6d",
      value: "6"
    },
    {
      text: "~7d",
      value: "7"
    },
    {
      text: ">7d",
      value: "8"
    }
  ]
};

const newTarget = {
  expr: 'ritual_txn_event{origin_prometheus=~"$origin_prometheus",job=~"$job"} - 0',
  format: "table",
  instant: true,
  refId: "X"
};

async function updatePanel() {
  try {
    // Получаем текущий дашборд
    const getDashboardResponse = await axios.get(`${apiUrl}/${dashboardUid}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    let dashboard = getDashboardResponse.data.dashboard;

    // Находим панель по ID
    let panel = dashboard.panels.find(p => p.id === panelId);

    if (panel) {
      // Добавляем новый стиль в конец массива styles
      if (!panel.styles) {
        panel.styles = [];
      }
      panel.styles.push(newStyle);

      // Добавляем новый target в массив targets
      if (!panel.targets) {
        panel.targets = [];
      }
      panel.targets.push(newTarget);

      // Подготавливаем данные для обновления дашборда
      const updateDashboardPayload = {
        dashboard: dashboard,
        overwrite: true
      };

      // Отправляем запрос на обновление дашборда
      const updateDashboardResponse = await axios.post('http://server_ip:3002/api/dashboards/db', updateDashboardPayload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Стиль и target успешно добавлены:', updateDashboardResponse.data);
    } else {
      console.error('Панель с указанным ID не найдена.');
    }
  } catch (error) {
    console.error('Ошибка при обновлении панели:', error.response ? error.response.data : error.message);
  }
}

updatePanel();
