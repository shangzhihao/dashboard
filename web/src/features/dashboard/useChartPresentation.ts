import { useMemo } from 'react';
import type { ChartAxesConfig, ChartSeriesConfig, ChartTitlesConfig } from '../../types/chart';
import { toApiContract } from './helpers';

type Translate = (key: string, options?: Record<string, unknown>) => string;

type CategoryOption = {
  value: string;
  label: string;
};

type UseChartPresentationParams = {
  chartSeries: ChartSeriesConfig[];
  chartAxes: ChartAxesConfig;
  chartTitles: ChartTitlesConfig;
  categoryOptions: CategoryOption[];
  categoryLabelMap: Record<string, string>;
  contractLabelMap: Record<string, string>;
  metricLabelMap: Record<string, string>;
  activeCategoryKey: string;
  activePillName: string;
  metricType: string;
  contractValue: string;
  calendarNearContractApplied: string;
  calendarFarContractApplied: string;
  interCommodityLeftCategoryApplied: string;
  interCommodityRightCategoryApplied: string;
  interCommodityLeftContractApplied: string;
  interCommodityRightContractApplied: string;
  isTermStructureView: boolean;
  isCalendarSpreadView: boolean;
  isInterCommoditySpreadView: boolean;
  translate: Translate;
};

type ChartTitleParams = Pick<
  UseChartPresentationParams,
  | 'categoryLabelMap'
  | 'activePillName'
  | 'calendarNearContractApplied'
  | 'calendarFarContractApplied'
  | 'interCommodityLeftCategoryApplied'
  | 'interCommodityRightCategoryApplied'
  | 'interCommodityLeftContractApplied'
  | 'interCommodityRightContractApplied'
  | 'isTermStructureView'
  | 'isCalendarSpreadView'
  | 'isInterCommoditySpreadView'
> & {
  activeCategoryLabel: string;
  activeContractLabel: string;
  activeMetricLabel: string;
  categoryOptionLabelMap: Record<string, string>;
};

const buildCategoryOptionLabelMap = (categoryOptions: CategoryOption[]) =>
  categoryOptions.reduce<Record<string, string>>((map, option) => {
    map[option.value] = option.label;
    return map;
  }, {});

const resolveChartTitle = ({
  activeCategoryLabel,
  activeContractLabel,
  activeMetricLabel,
  activePillName,
  calendarNearContractApplied,
  calendarFarContractApplied,
  categoryLabelMap,
  categoryOptionLabelMap,
  interCommodityLeftCategoryApplied,
  interCommodityLeftContractApplied,
  interCommodityRightCategoryApplied,
  interCommodityRightContractApplied,
  isTermStructureView,
  isCalendarSpreadView,
  isInterCommoditySpreadView,
}: ChartTitleParams) => {
  if (isTermStructureView) {
    return [activeCategoryLabel, activePillName].filter(Boolean).join(' ');
  }
  if (isCalendarSpreadView) {
    const near = toApiContract(calendarNearContractApplied);
    const far = toApiContract(calendarFarContractApplied);
    const pair = near && far ? `${near}-${far}` : '';
    return [activeCategoryLabel, pair, activePillName].filter(Boolean).join(' ');
  }
  if (isInterCommoditySpreadView) {
    const leftCategory =
      categoryOptionLabelMap[interCommodityLeftCategoryApplied] ||
      categoryLabelMap[interCommodityLeftCategoryApplied] ||
      interCommodityLeftCategoryApplied;
    const rightCategory =
      categoryOptionLabelMap[interCommodityRightCategoryApplied] ||
      categoryLabelMap[interCommodityRightCategoryApplied] ||
      interCommodityRightCategoryApplied;
    const leftContract = toApiContract(interCommodityLeftContractApplied);
    const rightContract = toApiContract(interCommodityRightContractApplied);
    const pair = [[leftCategory, leftContract].filter(Boolean).join(' '), [rightCategory, rightContract].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(' - ');
    return [pair, activePillName].filter(Boolean).join(' ');
  }
  return [activeCategoryLabel, activeContractLabel, activeMetricLabel].filter(Boolean).join(' ');
};

const resolveInterCommoditySeries = (
  chartSeries: ChartSeriesConfig[],
  categoryLabelMap: Record<string, string>,
  interCommodityLeftCategoryApplied: string,
  interCommodityLeftContractApplied: string,
  interCommodityRightCategoryApplied: string,
  interCommodityRightContractApplied: string,
): ChartSeriesConfig[] => {
  const leftLabel = [
    categoryLabelMap[interCommodityLeftCategoryApplied] || interCommodityLeftCategoryApplied,
    toApiContract(interCommodityLeftContractApplied),
  ]
    .filter(Boolean)
    .join(' ');
  const rightLabel = [
    categoryLabelMap[interCommodityRightCategoryApplied] || interCommodityRightCategoryApplied,
    toApiContract(interCommodityRightContractApplied),
  ]
    .filter(Boolean)
    .join(' ');
  const spreadSeries = chartSeries.find((series) => series.key === 'spread') ?? {
    key: 'spread',
    labelKey: 'chart.interCommoditySpread.series.spread',
    type: 'line',
    yAxisId: 'left',
    color: '#c14a3f',
    strokeWidth: 2,
  };

  return [
    { ...spreadSeries, labelKey: 'chart.interCommoditySpread.series.spread' },
    { key: 'left', label: leftLabel, type: 'line', yAxisId: 'left', color: '#f47b7b', strokeWidth: 2 },
    { key: 'right', label: rightLabel, type: 'line', yAxisId: 'left', color: '#9f1f5c', strokeWidth: 2 },
  ];
};

const useDisplayChartSeries = ({
  chartSeries,
  categoryLabelMap,
  interCommodityLeftCategoryApplied,
  interCommodityLeftContractApplied,
  interCommodityRightCategoryApplied,
  interCommodityRightContractApplied,
  isInterCommoditySpreadView,
}: Pick<
  UseChartPresentationParams,
  | 'chartSeries'
  | 'categoryLabelMap'
  | 'interCommodityLeftCategoryApplied'
  | 'interCommodityLeftContractApplied'
  | 'interCommodityRightCategoryApplied'
  | 'interCommodityRightContractApplied'
  | 'isInterCommoditySpreadView'
>) =>
  useMemo(() => {
    if (!isInterCommoditySpreadView) {
      return chartSeries;
    }
    return resolveInterCommoditySeries(
      chartSeries,
      categoryLabelMap,
      interCommodityLeftCategoryApplied,
      interCommodityLeftContractApplied,
      interCommodityRightCategoryApplied,
      interCommodityRightContractApplied,
    );
  }, [
    categoryLabelMap,
    chartSeries,
    interCommodityLeftCategoryApplied,
    interCommodityLeftContractApplied,
    interCommodityRightCategoryApplied,
    interCommodityRightContractApplied,
    isInterCommoditySpreadView,
  ]);

export const useChartPresentation = (params: UseChartPresentationParams) => {
  const activeCategoryLabel =
    params.categoryLabelMap[params.activeCategoryKey] || params.translate('common.feature');
  const activeContractLabel = params.contractLabelMap[params.contractValue] || params.contractValue;
  const effectiveMetricType =
    params.isTermStructureView || params.isCalendarSpreadView ? 'price' : params.metricType;
  const activeMetricLabel = params.metricLabelMap[effectiveMetricType] || effectiveMetricType;
  const categoryOptionLabelMap = useMemo(
    () => buildCategoryOptionLabelMap(params.categoryOptions),
    [params.categoryOptions],
  );

  const displayChartTitle = resolveChartTitle({
    activeCategoryLabel,
    activeContractLabel,
    activeMetricLabel,
    activePillName: params.activePillName,
    calendarNearContractApplied: params.calendarNearContractApplied,
    calendarFarContractApplied: params.calendarFarContractApplied,
    categoryLabelMap: params.categoryLabelMap,
    categoryOptionLabelMap,
    interCommodityLeftCategoryApplied: params.interCommodityLeftCategoryApplied,
    interCommodityLeftContractApplied: params.interCommodityLeftContractApplied,
    interCommodityRightCategoryApplied: params.interCommodityRightCategoryApplied,
    interCommodityRightContractApplied: params.interCommodityRightContractApplied,
    isTermStructureView: params.isTermStructureView,
    isCalendarSpreadView: params.isCalendarSpreadView,
    isInterCommoditySpreadView: params.isInterCommoditySpreadView,
  });

  const displayAxisLabel =
    effectiveMetricType === 'price'
      ? params.translate('chart.axes.left.price')
      : params.translate('chart.axes.left.positions');
  const displayChartTitles = { ...params.chartTitles, chart: displayChartTitle, chartKey: undefined };
  const displayChartAxes = params.isInterCommoditySpreadView
    ? params.chartAxes
    : { ...params.chartAxes, left: { ...(params.chartAxes.left ?? {}), label: displayAxisLabel, labelKey: undefined } };
  const displayChartSeries = useDisplayChartSeries({
    chartSeries: params.chartSeries,
    categoryLabelMap: params.categoryLabelMap,
    interCommodityLeftCategoryApplied: params.interCommodityLeftCategoryApplied,
    interCommodityLeftContractApplied: params.interCommodityLeftContractApplied,
    interCommodityRightCategoryApplied: params.interCommodityRightCategoryApplied,
    interCommodityRightContractApplied: params.interCommodityRightContractApplied,
    isInterCommoditySpreadView: params.isInterCommoditySpreadView,
  });
  const monthlyChangeTitle = params.translate('stats.monthlyChange.title', {
    category: activeCategoryLabel,
    contract: toApiContract(params.contractValue) || activeContractLabel,
  });

  return {
    effectiveMetricType,
    displayChartTitles,
    displayChartAxes,
    displayChartSeries,
    monthlyChangeTitle,
  };
};
