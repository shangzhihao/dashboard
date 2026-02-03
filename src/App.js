import './App.css';
import {
  Layout,
  Menu,
  Button,
  Input,
  Select,
  Space,
  Card,
  Typography,
} from 'antd';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const topNav = ['首页', '期货', '现货', '期货开户'];
const pillNav = [
  '持仓龙象榜',
  '席位追踪',
  '持仓净量',
  '移仓换月',
  '持仓多空图',
  '季节性分析',
  '仓单分析',
  '价差持仓',
  '期限结构',
  '跨期套利',
  '跨品种套利',
  '自定义套利',
  '基差分析',
  '库存周报',
  '产业利润',
  '更多待开发',
];

const sideMenuItems = [
  {
    key: 'black',
    label: '黑色系',
    children: [
      { key: 'black-iron', label: '铁矿' },
      { key: 'black-rebar', label: '螺纹' },
      { key: 'black-hot', label: '热卷' },
      { key: 'black-coal', label: '焦煤' },
    ],
  },
  {
    key: 'agri',
    label: '农产品',
    children: [
      { key: 'agri-meal', label: '豆粕' },
      { key: 'agri-corn', label: '玉米' },
      { key: 'agri-oil', label: '棕榈' },
    ],
  },
  {
    key: 'energy',
    label: '能源化工',
    children: [
      { key: 'energy-crude', label: '原油' },
      { key: 'energy-fuel', label: '燃油' },
      { key: 'energy-bitumen', label: '沥青' },
    ],
  },
  {
    key: 'metal',
    label: '有色',
    children: [
      { key: 'metal-cu', label: '铜/CU' },
      { key: 'metal-al', label: '铝/AL' },
      { key: 'metal-zn', label: '锌/ZN' },
      { key: 'metal-ni', label: '镍/NI' },
    ],
  },
];

const chartData = (() => {
  const points = 420;
  const start = new Date(2023, 0, 3);
  const data = [];

  for (let i = 0; i < points; i += 1) {
    const date = new Date(start.getTime() + i * 1000 * 60 * 60 * 24);
    const t = i / 30;
    const long = 9000 + 4800 * Math.sin(t) + 1400 * Math.sin(t / 2) + (i % 8) * 120;
    const short = 7600 + 4200 * Math.sin(t + 1.3) + 1200 * Math.cos(t / 3);
    const price = 18600 + 2200 * Math.sin(t / 1.7) + 900 * Math.sin(t / 3.2);
    const net = long - short;

    data.push({
      date: date.toISOString().slice(0, 10),
      long: Math.round(long),
      short: Math.round(short),
      net: Math.round(net),
      price: Math.round(price),
    });
  }

  return data;
})();

const tooltipFormatter = (value) => new Intl.NumberFormat('en-US').format(value);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="chart-tooltip-row">
          <span className="dot" style={{ background: entry.color }} />
          <span className="name">{entry.name}</span>
          <span className="value">{tooltipFormatter(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

function App() {
  const handleChartClick = (event) => {
    if (!event || !event.activeLabel) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log('Chart click:', event.activeLabel, event.activePayload);
  };

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-left">
          <div className="brand">
            <div className="logo">JN</div>
            <div className="brand-title">首页</div>
          </div>
          <Menu
            mode="horizontal"
            className="top-menu"
            items={topNav.map((item) => ({ key: item, label: item }))}
          />
        </div>
        <div className="header-right">
          <Input className="search" placeholder="搜索" />
          <div className="avatar">JS</div>
        </div>
      </Header>

      <Layout className="app-shell">
        <Sider width={220} className="app-sider">
          <div className="side-header">品类</div>
          <Menu
            mode="inline"
            className="side-menu"
            items={sideMenuItems}
            defaultOpenKeys={sideMenuItems.map((item) => item.key)}
          />
        </Sider>

        <Content className="app-content">
          <div className="pill-grid">
            {pillNav.map((item) => (
              <Button
                key={item}
                type={item === '持仓多空图' ? 'primary' : 'default'}
                className="pill"
              >
                {item}
              </Button>
            ))}
          </div>

          <Card className="panel" styles={{ body: { padding: 18 } }}>
            <div className="panel-header">
              <Title level={5} className="panel-title">
                持仓多空图
              </Title>
              <Space wrap>
                <Select
                  className="filter"
                  defaultValue="05 合约"
                  options={[
                    { value: '05 合约', label: '05 合约' },
                    { value: '06 合约', label: '06 合约' },
                    { value: '07 合约', label: '07 合约' },
                  ]}
                />
                <Select
                  className="filter"
                  defaultValue="净持仓"
                  options={[
                    { value: '净持仓', label: '净持仓' },
                    { value: '多头持仓', label: '多头持仓' },
                    { value: '空头持仓', label: '空头持仓' },
                  ]}
                />
                <Button type="primary" className="primary-btn">
                  查询
                </Button>
              </Space>
            </div>

            <Card className="chart-card" styles={{ body: { padding: 16 } }}>
              <div className="chart-title">沪铝/AL 05 合约持仓多空图</div>
              <div className="chart-wrap" style={{ minHeight: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                    onClick={handleChartClick}
                  >
                    <defs>
                      <linearGradient id="netArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e06262" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#e06262" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e6e9f2" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#7a8199', fontSize: 11 }} minTickGap={16} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: '#7a8199', fontSize: 11 }}
                      width={48}
                      label={{ value: '持仓(手)', angle: -90, position: 'insideLeft', fill: '#a0a7bd' }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: '#7a8199', fontSize: 11 }}
                      width={48}
                      label={{ value: '价格(元/吨)', angle: -90, position: 'insideRight', fill: '#a0a7bd' }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="net"
                      name="净持仓"
                      stroke="#e06262"
                      strokeWidth={1.5}
                      fill="url(#netArea)"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="long"
                      name="多头持仓"
                      stroke="#4aa3b4"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="short"
                      name="空头持仓"
                      stroke="#f0a45d"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="price"
                      name="价格"
                      stroke="#2f394d"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Brush dataKey="date" height={24} stroke="#6d63f3" travellerWidth={10} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="panel-footer">Copyright © 2018 - 2026 期货数据中心</div>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
