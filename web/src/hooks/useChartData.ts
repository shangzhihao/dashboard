import type {
  ChartAxesConfig,
  ChartDatum,
  ChartSeriesConfig,
  ChartTitlesConfig,
} from '../types/chart';
import { isRecord } from '../utils/guards';
import { useJsonResource } from './useJsonResource';

type ChartDataState = {
  chartData: ChartDatum[];
  chartSeries: ChartSeriesConfig[];
  chartAxes: ChartAxesConfig;
  chartTitles: ChartTitlesConfig;
};

const EMPTY_CHART_DATA_STATE: ChartDataState = {
  chartData: [],
  chartSeries: [],
  chartAxes: {},
  chartTitles: {},
};

const mapChartPayload = (payload: unknown): ChartDataState => {
  const items = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.items)
      ? payload.items
      : [];
  const series =
    isRecord(payload) && Array.isArray(payload.series) ? payload.series : [];
  const axes = isRecord(payload) && isRecord(payload.axes) ? payload.axes : {};
  const titles =
    isRecord(payload) && isRecord(payload.titles) ? payload.titles : {};

  return {
    chartData: (Array.isArray(items) ? items : []) as ChartDatum[],
    chartSeries: series as ChartSeriesConfig[],
    chartAxes: axes as ChartAxesConfig,
    chartTitles: titles as ChartTitlesConfig,
  };
};

export const useChartData = (chartDataUrl: string) => {
  return useJsonResource({
    url: chartDataUrl,
    emptyState: EMPTY_CHART_DATA_STATE,
    errorPrefix: 'Failed to load chart data',
    mapPayload: mapChartPayload,
  });
};
