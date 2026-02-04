import { useMemo } from 'react';
import { Button, Card, Select, Space, Typography } from 'antd';
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  ChartAxesConfig,
  ChartDatum,
  ChartSeriesConfig,
  ChartTitlesConfig,
  ChartTooltipProps,
} from '../types/chart';
import { normalizeSeriesConfig, tooltipFormatter } from '../utils/chart';

const { Title } = Typography;

type ChartPanelProps = {
  chartData: ChartDatum[];
  chartSeries: ChartSeriesConfig[];
  chartAxes: ChartAxesConfig;
  chartTitles: ChartTitlesConfig;
};

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((entry) => (
        <div
          key={String(entry.dataKey ?? entry.name ?? 'series')}
          className="chart-tooltip-row"
        >
          <span className="dot" style={{ background: entry.color }} />
          <span className="name">{entry.name}</span>
          <span className="value">{tooltipFormatter(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

const ChartPanel = ({
  chartData,
  chartSeries,
  chartAxes,
  chartTitles,
}: ChartPanelProps) => {
  const resolvedSeries = useMemo(
    () => normalizeSeriesConfig(chartSeries, chartData),
    [chartSeries, chartData],
  );
  const leftAxisLabel = chartAxes.left?.label ?? '持仓(手)';
  const panelTitle = chartTitles.panel ?? '持仓多空图';
  const chartTitle = chartTitles.chart ?? '沪铝/AL 05 合约持仓多空图';

  const handleChartClick = (
    event: { activeLabel?: string | number; activePayload?: unknown } | null,
  ) => {
    if (!event || !event.activeLabel) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log('Chart click:', event.activeLabel, event.activePayload);
  };

  return (
    <Card className="panel" styles={{ body: { padding: 18 } }}>
      <div className="panel-header">
        <Title level={5} className="panel-title">
          {panelTitle}
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
        <div className="chart-title">{chartTitle}</div>
        <div className="chart-wrap" style={{ minHeight: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
              onClick={handleChartClick}
            >
              <defs>
                {resolvedSeries
                  .filter((series) => series.type === 'area')
                  .map((series) => (
                    <linearGradient
                      key={series.key}
                      id={`area-${series.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={series.color}
                        stopOpacity={series.areaTopOpacity}
                      />
                      <stop
                        offset="100%"
                        stopColor={series.color}
                        stopOpacity={series.areaBottomOpacity}
                      />
                    </linearGradient>
                  ))}
              </defs>
              <CartesianGrid stroke="#e6e9f2" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#7a8199', fontSize: 11 }} minTickGap={16} />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#7a8199', fontSize: 11 }}
                width={48}
                label={{
                  value: leftAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#a0a7bd',
                }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              {resolvedSeries.map((series) =>
                series.type === 'area' ? (
                  <Area
                    key={series.key}
                    yAxisId={series.yAxisId}
                    type="monotone"
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.color}
                    strokeWidth={series.strokeWidth}
                    fill={`url(#area-${series.key})`}
                  />
                ) : (
                  <Line
                    key={series.key}
                    yAxisId={series.yAxisId}
                    type="monotone"
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.color}
                    strokeWidth={series.strokeWidth}
                    dot={false}
                  />
                ),
              )}
              <Brush dataKey="date" height={24} stroke="#6d63f3" travellerWidth={10} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="panel-footer">Copyright © 2018 - 2026 期货数据中心</div>
    </Card>
  );
};

export default ChartPanel;
