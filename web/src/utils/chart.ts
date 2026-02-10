import i18n, { getNumberLocale, normalizeLanguage } from '../i18n';
import type {
  ChartDatum,
  ChartSeriesConfig,
  NormalizedChartSeries,
} from '../types/chart';
import { isRecord } from './guards';

export const defaultSeriesPalette = [
  '#e4002b',
  '#f47b7b',
  '#9f1f5c',
  '#ef9020',
  '#00af3e',
  '#85b7e2',
  '#29245c',
  '#ffd616',
  '#e5352b',
  '#e990ab',
  '#0081b4',
  '#96cbb3',
  '#91be3e',
  '#39a6dd',
  '#eb0973',
  '#969491',
  '#333c41',
  '#74d2e7',
  '#48a9c5',
  '#0085ad',
  '#8db9ca',
  '#4298b5',
  '#005670',
  '#00205b',
  '#009f4d',
  '#84bd00',
  '#efdf00',
  '#fe5000',
  '#da1884',
  '#a51890',
  '#0077c8',
  '#008eaa',
  '#949483',
];

export const fallbackSeries: ChartSeriesConfig[] = [
  {
    key: 'net',
    label: 'Net Positions',
    labelKey: 'chart.series.net',
    type: 'area',
    yAxisId: 'left',
    color: '#e4002b',
  },
  {
    key: 'long',
    label: 'Long Positions',
    labelKey: 'chart.series.long',
    type: 'line',
    yAxisId: 'left',
    color: '#f47b7b',
  },
  {
    key: 'short',
    label: 'Short Positions',
    labelKey: 'chart.series.short',
    type: 'line',
    yAxisId: 'left',
    color: '#9f1f5c',
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
