import { useCalendarState } from './state/useCalendarState';
import { useDashboardDataUrls } from './state/useDashboardDataUrls';
import { useInterCommodityCategoryState } from './state/useInterCommodityCategoryState';
import { useInterCommodityContractState } from './state/useInterCommodityContractState';
import { useMetricContractState } from './state/useMetricContractState';
import { usePillViewState } from './state/usePillViewState';
import { useTermStructureState } from './state/useTermStructureState';
import type { UseDashboardStateParams } from './state/types';

export const useDashboardState = ({
  dataUrls,
  activeTopKey,
  activeCategoryKey,
  setActiveCategoryKey,
  pillNav,
  activePillKey,
  setActivePillKey,
  metricOptions,
  defaultMetricKey,
  metricContractMap,
  contractOptions,
  categoryOptions,
}: UseDashboardStateParams) => {
  const viewState = usePillViewState(activeTopKey, pillNav, activePillKey, setActivePillKey);
  const metricState = useMetricContractState(
    metricOptions,
    defaultMetricKey,
    metricContractMap,
    contractOptions,
  );
  const termStructureState = useTermStructureState();
  const calendarState = useCalendarState(metricState.activeContractKeys);
  const interCommodityContractState = useInterCommodityContractState(metricState.activeContractKeys);
  const interCommodityCategoryState = useInterCommodityCategoryState(categoryOptions, activeCategoryKey);
  const { chartDataUrl, monthlyChangeDataUrl } = useDashboardDataUrls({
    dataUrls,
    activeCategoryKey,
    metricType: metricState.metricType,
    contractValue: metricState.contractValue,
    isSeasonalChartView: viewState.isSeasonalChartView,
    isTermStructureView: viewState.isTermStructureView,
    isCalendarSpreadView: viewState.isCalendarSpreadView,
    isInterCommoditySpreadView: viewState.isInterCommoditySpreadView,
    isMonthlyChangeView: viewState.isMonthlyChangeView,
    termStructureDateApplied: termStructureState.termStructureDateApplied,
    calendarNearContractApplied: calendarState.calendarNearContractApplied,
    calendarFarContractApplied: calendarState.calendarFarContractApplied,
    interCommodityLeftCategoryApplied: interCommodityCategoryState.interCommodityLeftCategoryApplied,
    interCommodityRightCategoryApplied: interCommodityCategoryState.interCommodityRightCategoryApplied,
    interCommodityLeftContractApplied: interCommodityContractState.interCommodityLeftContractApplied,
    interCommodityRightContractApplied: interCommodityContractState.interCommodityRightContractApplied,
  });

  return {
    ...viewState,
    ...metricState,
    ...termStructureState,
    ...calendarState,
    ...interCommodityCategoryState,
    ...interCommodityContractState,
    chartDataUrl,
    monthlyChangeDataUrl,
    setActiveCategoryKey,
    categoryOptions,
  };
};
