import { useMemo } from 'react';
import { Button, Card, Select, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const resolvedSeries = useMemo(
    () => normalizeSeriesConfig(chartSeries, chartData),
    [chartSeries, chartData],
  );

  const resolveText = (key?: string, fallback?: string, defaultKey?: string) => {
    if (key) {
      return t(key);
    }
    if (fallback) {
      return fallback;
    }
    return defaultKey ? t(defaultKey) : '';
  };

  const leftAxisLabel = resolveText(
    chartAxes.left?.labelKey,
    chartAxes.left?.label,
    'chart.axes.left.label',
  );
  const panelTitle = resolveText(
    chartTitles.panelKey,
    chartTitles.panel,
    'chart.titles.panel',
  );
  const chartTitle = resolveText(
    chartTitles.chartKey,
    chartTitles.chart,
    'chart.titles.chart',
  );

  const contractOptions = [
    { value: 'contract-05', label: t('filters.contract.c05') },
    { value: 'contract-06', label: t('filters.contract.c06') },
    { value: 'contract-07', label: t('filters.contract.c07') },
  ];

  const metricOptions = [
    { value: 'metric-net', label: t('filters.metric.net') },
    { value: 'metric-long', label: t('filters.metric.long') },
    { value: 'metric-short', label: t('filters.metric.short') },
  ];

  return (
    <Card className="panel" styles={{ body: { padding: 18 } }}>
      <div className="panel-header">
        <Title level={5} className="panel-title">
          {panelTitle}
        </Title>
        <Space wrap>
          <Select
            className="filter"
            defaultValue="contract-05"
            options={contractOptions}
          />
          <Select
            className="filter"
            defaultValue="metric-net"
            options={metricOptions}
          />
          <Button type="primary" className="primary-btn">
            {t('actions.query')}
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
              {resolvedSeries.map((series) => {
                const seriesLabel = series.labelKey ? t(series.labelKey) : series.label;

                return series.type === 'area' ? (
                  <Area
                    key={series.key}
                    yAxisId={series.yAxisId}
                    type="monotone"
                    dataKey={series.key}
                    name={seriesLabel}
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
                    name={seriesLabel}
                    stroke={series.color}
                    strokeWidth={series.strokeWidth}
                    dot={false}
                  />
                );
              })}
              <Brush dataKey="date" height={24} stroke="#6d63f3" travellerWidth={10} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="panel-footer">
        {t('footer.copyright', { yearStart: 2018, yearEnd: 2026 })}
      </div>
    </Card>
  );
};

const handleChartClick = (
  event: { activeLabel?: string | number; activePayload?: unknown } | null,
) => {
  if (!event || !event.activeLabel) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log('Chart click:', event.activeLabel, event.activePayload);
};

export default ChartPanel;
