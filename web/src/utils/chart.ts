import i18n, { getNumberLocale, normalizeLanguage } from '../i18n';
import type {
  ChartDatum,
  ChartSeriesConfig,
  NormalizedChartSeries,
} from '../types/chart';
import { isRecord } from './guards';

export const defaultSeriesPalette = [
  '#4aa3b4',
  '#f0a45d',
  '#e06262',
  '#2f394d',
  '#6f79ff',
  '#6bc48b',
  '#d46cd5',
  '#c7a84a',
];

export const fallbackSeries: ChartSeriesConfig[] = [
  {
    key: 'net',
    label: 'Net Positions',
    labelKey: 'chart.series.net',
    type: 'area',
    yAxisId: 'left',
    color: '#e06262',
  },
  {
    key: 'long',
    label: 'Long Positions',
    labelKey: 'chart.series.long',
    type: 'line',
    yAxisId: 'left',
    color: '#4aa3b4',
  },
  {
    key: 'short',
    label: 'Short Positions',
    labelKey: 'chart.series.short',
    type: 'line',
    yAxisId: 'left',
    color: '#f0a45d',
  },
];

export const tooltipFormatter = (value: number | string | null | undefined) =>
  new Intl.NumberFormat(getNumberLocale(i18n.language)).format(Number(value ?? 0));

export const axisTickFormatter = (
  value: number | string | null | undefined,
  language: string = i18n.language,
) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return String(value ?? '');
  }

  const locale = getNumberLocale(language);
  const integerFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  if (Math.abs(numericValue) <= 10000) {
    return integerFormatter.format(numericValue);
  }

  const normalizedLanguage = normalizeLanguage(language);
  const compactFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const compactValue =
    normalizedLanguage === 'zh' ? numericValue / 10000 : numericValue / 1000;
  const suffix = normalizedLanguage === 'zh' ? '万' : 'K';
  return `${compactFormatter.format(compactValue)}${suffix}`;
};

export const normalizeSeriesConfig = (
  rawSeries: unknown,
  data: ChartDatum[],
): NormalizedChartSeries[] => {
  const fromConfig: ChartSeriesConfig[] = Array.isArray(rawSeries)
    ? (rawSeries.filter(Boolean) as ChartSeriesConfig[])
    : isRecord(rawSeries)
      ? Object.entries(rawSeries).map(([key, value]) => ({
          key,
          ...(isRecord(value) ? (value as ChartSeriesConfig) : {}),
        }))
      : [];

  let series = fromConfig.filter((item) => item && item.key);

  if (series.length === 0) {
    const sample = data?.[0] || {};
    const dataKeys = Object.keys(sample).filter((key) => key !== 'date');
    if (dataKeys.length > 0) {
      series = dataKeys.map((key) => ({ key, label: key, type: 'line', yAxisId: 'left' }));
    } else {
      series = fallbackSeries;
    }
  }

  if (series.length > 0) {
    const sample = data?.[0] || {};
    const configuredKeys = new Set(series.map((item) => item.key));
    const extraKeys = Object.keys(sample).filter(
      (key) => key !== 'date' && !configuredKeys.has(key),
    );
    if (extraKeys.length > 0) {
      series = series.concat(
        extraKeys.map((key) => ({ key, label: key, type: 'line', yAxisId: 'left' })),
      );
    }
  }

  return series.map((item, index): NormalizedChartSeries => {
    const color = item.color || defaultSeriesPalette[index % defaultSeriesPalette.length];
    const type = item.type === 'area' ? 'area' : 'line';
    return {
      key: item.key,
      label: item.label || item.name || item.key,
      labelKey: item.labelKey,
      type,
      yAxisId: item.yAxisId === 'right' ? 'right' : 'left',
      color,
      strokeWidth: item.strokeWidth ?? (type === 'area' ? 1.5 : 2),
      areaTopOpacity: item.areaTopOpacity ?? 0.55,
      areaBottomOpacity: item.areaBottomOpacity ?? 0.05,
    };
  });
};
