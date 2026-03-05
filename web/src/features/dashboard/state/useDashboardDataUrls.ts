import { useMemo } from 'react';
import { toApiContract, toTermStructureDatePath } from '../helpers';
import type { DataUrls } from './types';

type ChartDataUrlParams = {
  dataUrls: DataUrls;
  activeCategoryKey: string;
  metricType: string;
  contractValue: string;
  isSeasonalChartView: boolean;
  isTermStructureView: boolean;
  isCalendarSpreadView: boolean;
  isInterCommoditySpreadView: boolean;
  termStructureDateApplied: string;
  calendarNearContractApplied: string;
  calendarFarContractApplied: string;
  interCommodityLeftCategoryApplied: string;
  interCommodityRightCategoryApplied: string;
  interCommodityLeftContractApplied: string;
  interCommodityRightContractApplied: string;
};

const buildChartDataUrl = ({
  dataUrls,
  activeCategoryKey,
  metricType,
  contractValue,
  isSeasonalChartView,
  isTermStructureView,
  isCalendarSpreadView,
  isInterCommoditySpreadView,
  termStructureDateApplied,
  calendarNearContractApplied,
  calendarFarContractApplied,
  interCommodityLeftCategoryApplied,
  interCommodityRightCategoryApplied,
  interCommodityLeftContractApplied,
  interCommodityRightContractApplied,
}: ChartDataUrlParams) => {
  if (
    !isSeasonalChartView &&
    !isTermStructureView &&
    !isCalendarSpreadView &&
    !isInterCommoditySpreadView
  ) {
    return '';
  }
  if (!activeCategoryKey && !isInterCommoditySpreadView) {
    return '';
  }
  if (isInterCommoditySpreadView) {
    if (
      !interCommodityLeftCategoryApplied ||
      !interCommodityRightCategoryApplied ||
      !interCommodityLeftContractApplied ||
      !interCommodityRightContractApplied
    ) {
      return '';
    }
    if (
      interCommodityLeftCategoryApplied === interCommodityRightCategoryApplied &&
      interCommodityLeftContractApplied === interCommodityRightContractApplied
    ) {
      return '';
    }
    return `${dataUrls.interCommoditySpread}/${interCommodityLeftCategoryApplied}/${toApiContract(interCommodityLeftContractApplied)}/${interCommodityRightCategoryApplied}/${toApiContract(interCommodityRightContractApplied)}.json`;
  }
  if (isCalendarSpreadView) {
    if (!calendarNearContractApplied || !calendarFarContractApplied) {
      return '';
    }
    return `${dataUrls.calendarSpread}/${activeCategoryKey}/${toApiContract(calendarNearContractApplied)}/${toApiContract(calendarFarContractApplied)}.json`;
  }
  if (isTermStructureView) {
    const datePath = toTermStructureDatePath(termStructureDateApplied);
    return datePath ? `${dataUrls.termStructure}/${activeCategoryKey}/${datePath}.json` : '';
  }
  if (!contractValue || !metricType) {
    return '';
  }
  const baseUrl = metricType === 'price' ? dataUrls.chartDataPrice : dataUrls.chartDataPositions;
  return `${baseUrl}/${activeCategoryKey}/${toApiContract(contractValue)}.json`;
};

const buildMonthlyChangeDataUrl = (
  dataUrls: DataUrls,
  isMonthlyChangeView: boolean,
  activeCategoryKey: string,
  contractValue: string,
) => {
  if (!isMonthlyChangeView || !activeCategoryKey || !contractValue) {
    return '';
  }
  return `${dataUrls.monthlyChangeStats}/${activeCategoryKey}/${toApiContract(contractValue)}.json`;
};

export const useDashboardDataUrls = ({
  dataUrls,
  activeCategoryKey,
  metricType,
  contractValue,
  isSeasonalChartView,
  isTermStructureView,
  isCalendarSpreadView,
  isInterCommoditySpreadView,
  isMonthlyChangeView,
  termStructureDateApplied,
  calendarNearContractApplied,
  calendarFarContractApplied,
  interCommodityLeftCategoryApplied,
  interCommodityRightCategoryApplied,
  interCommodityLeftContractApplied,
  interCommodityRightContractApplied,
}: ChartDataUrlParams & { isMonthlyChangeView: boolean }) => {
  const chartDataUrl = useMemo(
    () =>
      buildChartDataUrl({
        dataUrls,
        activeCategoryKey,
        metricType,
        contractValue,
        isSeasonalChartView,
        isTermStructureView,
        isCalendarSpreadView,
        isInterCommoditySpreadView,
        termStructureDateApplied,
        calendarNearContractApplied,
        calendarFarContractApplied,
        interCommodityLeftCategoryApplied,
        interCommodityRightCategoryApplied,
        interCommodityLeftContractApplied,
        interCommodityRightContractApplied,
      }),
    [
      activeCategoryKey,
      calendarFarContractApplied,
      calendarNearContractApplied,
      contractValue,
      dataUrls,
      interCommodityLeftCategoryApplied,
      interCommodityLeftContractApplied,
      interCommodityRightCategoryApplied,
      interCommodityRightContractApplied,
      isCalendarSpreadView,
      isInterCommoditySpreadView,
      isSeasonalChartView,
      isTermStructureView,
      metricType,
      termStructureDateApplied,
    ],
  );

  const monthlyChangeDataUrl = useMemo(
    () => buildMonthlyChangeDataUrl(dataUrls, isMonthlyChangeView, activeCategoryKey, contractValue),
    [activeCategoryKey, contractValue, dataUrls, isMonthlyChangeView],
  );

  return { chartDataUrl, monthlyChangeDataUrl };
};
