import { useEffect, useMemo, useState } from 'react';
import { Card, Select, Space, Typography } from 'antd';
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
import type { DefaultLegendContentProps } from 'recharts';
import { normalizeLanguage } from '../i18n';
import type { ReactNode } from 'react';
import type {
  ChartAxesConfig,
  ChartDatum,
  ChartSeriesConfig,
  ChartTitlesConfig,
  ChartTooltipProps,
} from '../types/chart';
import { axisTickFormatter, normalizeSeriesConfig, tooltipFormatter } from '../utils/chart';

const { Title } = Typography;

type ChartPanelProps = {
  chartData: ChartDatum[];
  chartSeries: ChartSeriesConfig[];
  chartAxes: ChartAxesConfig;
  chartTitles: ChartTitlesConfig;
  contractOptions: Array<{ value: string; label: string }>;
  contractValue: string;
  metricOptions: Array<{ value: string; label: string }>;
  metricValue: string;
  onContractChange: (value: string) => void;
  onMetricChange: (value: string) => void;
  controls?: ReactNode;
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
  contractOptions,
  contractValue,
  metricOptions,
  metricValue,
  onContractChange,
  onMetricChange,
  controls,
}: ChartPanelProps) => {
  const { t, i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const toggleText = language === 'en' ? '中' : 'EN';
  const [hiddenSeriesKeys, setHiddenSeriesKeys] = useState<Set<string>>(new Set());

  const resolvedSeries = useMemo(
    () => normalizeSeriesConfig(chartSeries, chartData),
    [chartSeries, chartData],
  );

  useEffect(() => {
    const nextHidden = new Set<string>();
    resolvedSeries.slice(5).forEach((series) => {
      nextHidden.add(series.key);
    });
    setHiddenSeriesKeys(nextHidden);
  }, [resolvedSeries]);

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
  const formatXAxisTick = (value: string | number) => {
    const text = String(value);
    if (text === 'near') {
      return t('chart.termStructure.near');
    }
    const nextMatch = text.match(/^n(\d{1,2})$/);
    if (nextMatch) {
      return t('chart.termStructure.next', { count: Number(nextMatch[1]) });
    }
    if (/^\d{2}-\d{2}$/.test(text)) {
      return text;
    }
    const match = text.match(/^\d{4}-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) {
      return text;
    }
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  };
  const chartTitle = resolveText(
    chartTitles.chartKey,
    chartTitles.chart,
    'chart.titles.chart',
  );

  const visibleSeries = useMemo(
    () => resolvedSeries.filter((series) => !hiddenSeriesKeys.has(series.key)),
    [hiddenSeriesKeys, resolvedSeries],
  );

  const yAxisDomain = useMemo<[number, number] | undefined>(() => {
    const values: number[] = [];
    chartData.forEach((row) => {
      visibleSeries.forEach((series) => {
        const raw = row[series.key];
        const value =
          typeof raw === 'number'
            ? raw
            : typeof raw === 'string'
              ? Number(raw)
              : NaN;
        if (Number.isFinite(value)) {
          values.push(value);
        }
      });
    });

    if (values.length === 0) {
      return undefined;
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    const padding = range === 0 ? Math.max(Math.abs(maxValue) * 0.05, 1) : range * 0.08;
    const nextMin = minValue - padding;
    const nextMax = maxValue + padding;
    return [nextMin, nextMax];
  }, [chartData, visibleSeries]);

  const yAxisTickFormatter = useMemo(
    () => (value: string | number) => axisTickFormatter(value, i18n.language),
    [i18n.language],
  );

  const handleLegendToggle = (dataKey: string) => {
    setHiddenSeriesKeys((prev) => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        next.delete(dataKey);
      } else {
        next.add(dataKey);
      }
      return next;
    });
  };

  const renderLegend = (_props: DefaultLegendContentProps) => {
    return (
      <div className="chart-legend">
        {resolvedSeries.map((series) => {
          const label = series.labelKey ? t(series.labelKey) : series.label;
          const isHidden = hiddenSeriesKeys.has(series.key);
          const color = isHidden ? '#c2c6d6' : series.color || '#6d63f3';
          return (
            <button
              key={series.key}
              type="button"
              className="chart-legend-item"
              onClick={() => {
                handleLegendToggle(series.key);
              }}
              style={{ color }}
            >
              <span className="chart-legend-dot" style={{ background: color }} />
              {label}
            </button>
          );
        })}
      </div>
    );
  };

  // Reserve legend space by estimated rows so wrapped items never overlap chart content.
  const legendRows = Math.max(1, Math.ceil(resolvedSeries.length / 13));
  const legendHeight = 36 + (legendRows - 1) * 24;
  const chartMinHeight = 320 + (legendRows - 1) * 24;

  return (
    <Card className="panel" styles={{ body: { padding: 18 } }}>
      <div className="panel-header">
        <Title level={5} className="panel-title">
          {chartTitle}
        </Title>
        <Space wrap>
          {contractOptions.length > 0 ? (
            <Select
              className="filter"
              value={contractValue}
              onChange={onContractChange}
              options={contractOptions}
            />
          ) : null}
          {metricOptions.length > 0 ? (
            <Select
              className="filter"
              value={metricValue}
              onChange={onMetricChange}
              options={metricOptions}
            />
          ) : null}
          {controls}
        </Space>
      </div>

      <Card className="chart-card" styles={{ body: { padding: 16 } }}>
        <div className="chart-wrap" style={{ minHeight: chartMinHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 24, left: 10, bottom: 0 }}
              onClick={handleChartClick}
            >
              <defs>
                {visibleSeries
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
              <XAxis
                dataKey="date"
                tick={{ fill: '#7a8199', fontSize: 11 }}
                minTickGap={16}
                interval="preserveStartEnd"
                tickFormatter={formatXAxisTick}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#7a8199', fontSize: 11 }}
                width={84}
                tickMargin={8}
                domain={yAxisDomain}
                tickFormatter={yAxisTickFormatter}
                label={{
                  value: leftAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  dx: 6,
                  fill: '#a0a7bd',
                }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="top"
                height={legendHeight}
                iconType="circle"
                content={renderLegend}
              />
              {visibleSeries.map((series) => {
                const seriesLabel = series.labelKey ? t(series.labelKey) : series.label;

                return series.type === 'area' ? (
                  <Area
                    key={series.key}
                    yAxisId={series.yAxisId}
                    type="monotone"
                    dataKey={series.key}
                    name={seriesLabel}
                    connectNulls
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
                    connectNulls
                    stroke={series.color}
                    strokeWidth={series.strokeWidth}
                    dot={false}
                  />
                );
              })}
              <Brush
                dataKey="date"
                height={24}
                stroke="#6d63f3"
                travellerWidth={10}
                tickFormatter={formatXAxisTick}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="panel-footer">
        {t('footer.copyright', { yearStart: 2018, yearEnd: 2026 })}
        {' '}
        <button
          type="button"
          className="footer-lang-toggle"
          onClick={() => i18n.changeLanguage(language === 'en' ? 'zh' : 'en')}
        >
          {toggleText}
        </button>
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
  console.log('Chart click:', event.activeLabel, event.activePayload);
};

export default ChartPanel;
