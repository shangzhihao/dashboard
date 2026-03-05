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

export const useChartPresentation = ({
  chartSeries,
  chartAxes,
  chartTitles,
  categoryOptions,
  categoryLabelMap,
  contractLabelMap,
  metricLabelMap,
  activeCategoryKey,
  activePillName,
  metricType,
  contractValue,
  calendarNearContractApplied,
  calendarFarContractApplied,
  interCommodityLeftCategoryApplied,
  interCommodityRightCategoryApplied,
  interCommodityLeftContractApplied,
  interCommodityRightContractApplied,
  isTermStructureView,
  isCalendarSpreadView,
  isInterCommoditySpreadView,
  translate,
}: UseChartPresentationParams) => {
  const activeCategoryLabel = categoryLabelMap[activeCategoryKey] || translate('common.feature');
  const activeContractLabel = contractLabelMap[contractValue] || contractValue;
  const effectiveMetricType = isTermStructureView || isCalendarSpreadView ? 'price' : metricType;
  const activeMetricLabel = metricLabelMap[effectiveMetricType] || effectiveMetricType;

  const categoryOptionLabelMap = useMemo(
    () =>
      categoryOptions.reduce<Record<string, string>>((map, option) => {
        map[option.value] = option.label;
        return map;
      }, {}),
    [categoryOptions],
  );

  const displayChartTitle = useMemo(() => {
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
      const leftLeg = [leftCategory, leftContract].filter(Boolean).join(' ');
      const rightLeg = [rightCategory, rightContract].filter(Boolean).join(' ');
      const pair = [leftLeg, rightLeg].filter(Boolean).join(' - ');
      return [pair, activePillName].filter(Boolean).join(' ');
    }

    return [activeCategoryLabel, activeContractLabel, activeMetricLabel].filter(Boolean).join(' ');
  }, [
    activeCategoryLabel,
    activeContractLabel,
    activeMetricLabel,
    activePillName,
    calendarFarContractApplied,
    calendarNearContractApplied,
    categoryLabelMap,
    categoryOptionLabelMap,
    interCommodityLeftCategoryApplied,
    interCommodityLeftContractApplied,
    interCommodityRightCategoryApplied,
    interCommodityRightContractApplied,
    isCalendarSpreadView,
    isInterCommoditySpreadView,
    isTermStructureView,
  ]);

  const displayAxisLabel = useMemo(
    () =>
      effectiveMetricType === 'price'
        ? translate('chart.axes.left.price')
        : translate('chart.axes.left.positions'),
    [effectiveMetricType, translate],
  );

  const displayChartTitles = useMemo(
    () => ({
      ...chartTitles,
      chart: displayChartTitle,
      chartKey: undefined,
    }),
    [chartTitles, displayChartTitle],
  );

  const displayChartAxes = useMemo(
    () =>
      isInterCommoditySpreadView
        ? chartAxes
        : {
            ...chartAxes,
            left: {
              ...(chartAxes.left ?? {}),
              label: displayAxisLabel,
              labelKey: undefined,
            },
          },
    [chartAxes, displayAxisLabel, isInterCommoditySpreadView],
  );

  const displayChartSeries = useMemo<ChartSeriesConfig[]>(() => {
    if (!isInterCommoditySpreadView) {
      return chartSeries;
    }
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
      {
        ...spreadSeries,
        labelKey: 'chart.interCommoditySpread.series.spread',
      },
      {
        key: 'left',
        label: leftLabel,
        type: 'line',
        yAxisId: 'left',
        color: '#f47b7b',
        strokeWidth: 2,
      },
      {
        key: 'right',
        label: rightLabel,
        type: 'line',
        yAxisId: 'left',
        color: '#9f1f5c',
        strokeWidth: 2,
      },
    ];
  }, [
    categoryLabelMap,
    chartSeries,
    interCommodityLeftCategoryApplied,
    interCommodityLeftContractApplied,
    interCommodityRightCategoryApplied,
    interCommodityRightContractApplied,
    isInterCommoditySpreadView,
  ]);

  const monthlyChangeTitle = useMemo(
    () =>
      translate('stats.monthlyChange.title', {
        category: activeCategoryLabel,
        contract: toApiContract(contractValue) || activeContractLabel,
      }),
    [activeCategoryLabel, activeContractLabel, contractValue, translate],
  );

  return {
    effectiveMetricType,
    displayChartTitles,
    displayChartAxes,
    displayChartSeries,
    monthlyChangeTitle,
  };
};
