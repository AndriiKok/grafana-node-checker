const axios = require('axios');

const apiUrl = 'http://server_ip:3002/api/dashboards/uid';
const apiKey = 'api_key';
const dashboardUid = 'dash_uid';

const newPanel = {
  columns: [],
  datasource: "Prometheus",
  fontSize: "80%",
  gridPos: {
    h: 7,
    w: 24,
    x: 0,
    y: 0
  },
  id: null, // ID будет назначен автоматически
  options: {},
  pageSize: null,
  showHeader: true,
  sort: {
    col: 0,
    desc: true
  },
  styles: [
    {
      alias: "",
      colorMode: null,
      colors: [
        "rgba(245, 54, 54, 0.9)",
        "rgba(237, 129, 40, 0.89)",
        "rgba(50, 172, 45, 0.97)"
      ],
      dateFormat: "YYYY-MM-DD HH:mm:ss",
      decimals: 2,
      mappingType: 1,
      pattern: "Time",
      thresholds: [],
      type: "hidden",
      unit: "short"
    },
    {
      alias: "",
      colorMode: null,
      colors: [
        "rgba(245, 54, 54, 0.9)",
        "rgba(237, 129, 40, 0.89)",
        "rgba(50, 172, 45, 0.97)"
      ],
      dateFormat: "YYYY-MM-DD HH:mm:ss",
      decimals: 2,
      mappingType: 1,
      pattern: "__name__",
      thresholds: [],
      type: "hidden",
      unit: "short"
    },
    {
      alias: "",
      colorMode: null,
      colors: [
        "rgba(245, 54, 54, 0.9)",
        "rgba(237, 129, 40, 0.89)",
        "rgba(50, 172, 45, 0.97)"
      ],
      dateFormat: "YYYY-MM-DD HH:mm:ss",
      decimals: 2,
      mappingType: 1,
      pattern: "job",
      thresholds: [],
      type: "hidden",
      unit: "short"
    }
  ],
  timeFrom: null,
  timeShift: null,
  title: "Nodes Checker",
  transform: "table",
  type: "table"
};

async function addPanel() {
  try {
    // Получаем текущий дашборд
    const getDashboardResponse = await axios.get(`${apiUrl}/${dashboardUid}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    let dashboard = getDashboardResponse.data.dashboard;

    if (!dashboard.panels) {
      dashboard.panels = [];
    }

    // Вставляем новую панель в массив панелей
    dashboard.panels.push(newPanel);

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

    // Извлекаем последнюю добавленную панель (новая панель будет последней в массиве)
    const addedPanel = dashboard.panels[dashboard.panels.length - 1];
    const newPanelUid = addedPanel.id;

    // Выводим PANEL_UID для захвата в bash-скрипте
    console.log('PANEL_UID:', newPanelUid);

    console.log('Панель успешно добавлена:', updateDashboardResponse.data);
  } catch (error) {
    console.error('Ошибка при добавлении панели:', error.response ? error.response.data : error.message);
  }
}

addPanel();
