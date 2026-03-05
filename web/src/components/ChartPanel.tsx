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
import ChartLegend from './chart/ChartLegend';
import ChartTooltip from './chart/ChartTooltip';
import { computeAxisDomain, formatXAxisTick, legendDimensions } from './chart/chartUtils';
import { normalizeLanguage } from '../i18n';
import type { ReactNode } from 'react';
import type {
  ChartAxesConfig,
  ChartDatum,
  ChartSeriesConfig,
  ChartTitlesConfig,
} from '../types/chart';
import { axisTickFormatter, normalizeSeriesConfig } from '../utils/chart';

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

const handleChartClick = (
  event: { activeLabel?: string | number; activePayload?: unknown } | null,
) => {
  if (!event || !event.activeLabel) {
    return;
  }
  console.log('Chart click:', event.activeLabel, event.activePayload);
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

  const chartTitle = resolveText(chartTitles.chartKey, chartTitles.chart, 'chart.titles.chart');
  const leftAxisLabel = resolveText(
    chartAxes.left?.labelKey,
    chartAxes.left?.label,
    'chart.axes.left.label',
  );
  const rightAxisLabel = resolveText(
    chartAxes.right?.labelKey,
    chartAxes.right?.label,
    'chart.axes.right.spread',
  );

  const visibleSeries = useMemo(
    () => resolvedSeries.filter((series) => !hiddenSeriesKeys.has(series.key)),
    [hiddenSeriesKeys, resolvedSeries],
  );

  const leftAxisDomain = useMemo<[number, number] | undefined>(
    () => computeAxisDomain(chartData, visibleSeries, 'left'),
    [chartData, visibleSeries],
  );
  const rightAxisDomain = useMemo<[number, number] | undefined>(
    () => computeAxisDomain(chartData, visibleSeries, 'right'),
    [chartData, visibleSeries],
  );

  const showRightAxis = useMemo(
    () =>
      visibleSeries.some((series) => series.yAxisId === 'right') ||
      Boolean(chartAxes.right?.label || chartAxes.right?.labelKey),
    [chartAxes.right?.label, chartAxes.right?.labelKey, visibleSeries],
  );

  const yAxisTickFormatter = useMemo(
    () => (value: string | number) => axisTickFormatter(value, i18n.language),
    [i18n.language],
  );

  const xAxisTickFormatter = useMemo(
    () => (value: string | number) => formatXAxisTick(value, t),
    [t],
  );

  const { legendHeight, chartMinHeight } = legendDimensions(resolvedSeries.length);

  const toggleSeries = (dataKey: string) => {
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

  const renderLegend = (_props: DefaultLegendContentProps) => (
    <ChartLegend
      resolvedSeries={resolvedSeries}
      hiddenSeriesKeys={hiddenSeriesKeys}
      onToggle={toggleSeries}
      translate={t}
    />
  );

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
                    <linearGradient key={series.key} id={`area-${series.key}`} x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={xAxisTickFormatter}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#7a8199', fontSize: 11 }}
                width={84}
                tickMargin={8}
                domain={leftAxisDomain}
                tickFormatter={yAxisTickFormatter}
                label={{
                  value: leftAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  dx: 6,
                  fill: '#a0a7bd',
                }}
              />
              {showRightAxis ? (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#7a8199', fontSize: 11 }}
                  width={84}
                  tickMargin={8}
                  domain={rightAxisDomain}
                  tickFormatter={yAxisTickFormatter}
                  label={{
                    value: rightAxisLabel,
                    angle: 90,
                    position: 'insideRight',
                    dx: -6,
                    fill: '#a0a7bd',
                  }}
                />
              ) : null}
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="top" height={legendHeight} iconType="circle" content={renderLegend} />
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
                tickFormatter={xAxisTickFormatter}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="panel-footer">
        {t('footer.copyright', { yearStart: 2018, yearEnd: 2026 })}{' '}
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

export default ChartPanel;
