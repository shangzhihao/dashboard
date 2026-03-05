import { useEffect, useMemo, useState } from 'react';
import { Card, Select, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { DefaultLegendContentProps } from 'recharts';
import ChartComposedPlot from './chart/ChartComposedPlot';
import ChartLegend from './chart/ChartLegend';
import { computeAxisDomain, formatXAxisTick, legendDimensions } from './chart/chartUtils';
import { normalizeLanguage } from '../i18n';
import type { ReactNode } from 'react';
import type {
  ChartAxesConfig,
  ChartDatum,
  ChartSeriesConfig,
  ChartTitlesConfig,
  NormalizedChartSeries,
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

const resolveText = (
  translate: (key: string) => string,
  key?: string,
  fallback?: string,
  defaultKey?: string,
) => (key ? translate(key) : fallback ?? (defaultKey ? translate(defaultKey) : ''));

const useVisibleSeries = (chartSeries: ChartSeriesConfig[], chartData: ChartDatum[]) => {
  const [hiddenSeriesKeys, setHiddenSeriesKeys] = useState<Set<string>>(new Set());
  const resolvedSeries = useMemo(() => normalizeSeriesConfig(chartSeries, chartData), [chartSeries, chartData]);

  useEffect(() => {
    setHiddenSeriesKeys(new Set(resolvedSeries.slice(5).map((series) => series.key)));
  }, [resolvedSeries]);

  const visibleSeries = useMemo(
    () => resolvedSeries.filter((series) => !hiddenSeriesKeys.has(series.key)),
    [hiddenSeriesKeys, resolvedSeries],
  );

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

  return { resolvedSeries, visibleSeries, hiddenSeriesKeys, toggleSeries };
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
  const { resolvedSeries, visibleSeries, hiddenSeriesKeys, toggleSeries } = useVisibleSeries(chartSeries, chartData);

  const chartTitle = resolveText(t, chartTitles.chartKey, chartTitles.chart, 'chart.titles.chart');
  const leftAxisLabel = resolveText(t, chartAxes.left?.labelKey, chartAxes.left?.label, 'chart.axes.left.label');
  const rightAxisLabel = resolveText(t, chartAxes.right?.labelKey, chartAxes.right?.label, 'chart.axes.right.spread');
  const leftAxisDomain = useMemo(() => computeAxisDomain(chartData, visibleSeries, 'left'), [chartData, visibleSeries]);
  const rightAxisDomain = useMemo(() => computeAxisDomain(chartData, visibleSeries, 'right'), [chartData, visibleSeries]);
  const showRightAxis = useMemo(
    () => visibleSeries.some((series) => series.yAxisId === 'right') || Boolean(chartAxes.right?.label || chartAxes.right?.labelKey),
    [chartAxes.right?.label, chartAxes.right?.labelKey, visibleSeries],
  );

  const yAxisTickFormatter = useMemo(
    () => (value: string | number) => axisTickFormatter(value, i18n.language),
    [i18n.language],
  );
  const xAxisTickFormatter = useMemo(() => (value: string | number) => formatXAxisTick(value, t), [t]);
  const { legendHeight, chartMinHeight } = legendDimensions(resolvedSeries.length);

  const renderLegend = (_props: DefaultLegendContentProps) => (
    <ChartLegend resolvedSeries={resolvedSeries} hiddenSeriesKeys={hiddenSeriesKeys} onToggle={toggleSeries} translate={t} />
  );
  const resolveSeriesLabel = (series: NormalizedChartSeries) => (series.labelKey ? t(series.labelKey) : series.label);

  return (
    <Card className="panel" styles={{ body: { padding: 18 } }}>
      <div className="panel-header">
        <Title level={5} className="panel-title">{chartTitle}</Title>
        <Space wrap>
          {contractOptions.length > 0 ? <Select className="filter" value={contractValue} onChange={onContractChange} options={contractOptions} /> : null}
          {metricOptions.length > 0 ? <Select className="filter" value={metricValue} onChange={onMetricChange} options={metricOptions} /> : null}
          {controls}
        </Space>
      </div>

      <Card className="chart-card" styles={{ body: { padding: 16 } }}>
        <div className="chart-wrap" style={{ minHeight: chartMinHeight }}>
          <ChartComposedPlot
            chartData={chartData}
            visibleSeries={visibleSeries}
            leftAxisDomain={leftAxisDomain}
            rightAxisDomain={rightAxisDomain}
            showRightAxis={showRightAxis}
            yAxisTickFormatter={yAxisTickFormatter}
            xAxisTickFormatter={xAxisTickFormatter}
            axisLabels={{ leftAxisLabel, rightAxisLabel }}
            legendHeight={legendHeight}
            onLegendRender={renderLegend}
            onChartClick={handleChartClick}
            resolveSeriesLabel={resolveSeriesLabel}
          />
        </div>
      </Card>

      <div className="panel-footer">
        {t('footer.copyright', { yearStart: 2018, yearEnd: 2026 })}{' '}
        <button type="button" className="footer-lang-toggle" onClick={() => i18n.changeLanguage(language === 'en' ? 'zh' : 'en')}>
          {language === 'en' ? '中' : 'EN'}
        </button>
      </div>
    </Card>
  );
};

export default ChartPanel;
