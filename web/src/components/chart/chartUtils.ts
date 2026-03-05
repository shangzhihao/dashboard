import type { ChartDatum, NormalizedChartSeries } from '../../types/chart';

export const computeAxisDomain = (
  chartData: ChartDatum[],
  visibleSeries: NormalizedChartSeries[],
  axisId: 'left' | 'right',
) => {
  const values: number[] = [];
  chartData.forEach((row) => {
    visibleSeries
      .filter((series) => series.yAxisId === axisId)
      .forEach((series) => {
        const raw = row[series.key];
        const value =
          typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN;
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
  return [minValue - padding, maxValue + padding] as [number, number];
};

export const formatXAxisTick = (value: string | number, translate: (key: string, options?: Record<string, unknown>) => string) => {
  const text = String(value);
  if (text === 'near') {
    return translate('chart.termStructure.near');
  }
  const nextMatch = text.match(/^n(\d{1,2})$/);
  if (nextMatch) {
    return translate('chart.termStructure.next', { count: Number(nextMatch[1]) });
  }
  if (/^\d{2}-\d{2}$/.test(text)) {
    return text;
  }
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return text;
  }
  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const legendDimensions = (seriesCount: number) => {
  const legendRows = Math.max(1, Math.ceil(seriesCount / 13));
  return {
    legendHeight: 36 + (legendRows - 1) * 24,
    chartMinHeight: 320 + (legendRows - 1) * 24,
  };
};
