import { useEffect, useMemo, useState } from 'react';
import type { NavItem, PillFunc } from '../../types/nav';
import { resolvePillAction } from '../../utils/nav';
import {
  getCurrentContractKey,
  getTodayIsoDate,
  resolveSecondChoice,
  toApiContract,
  toTermStructureDatePath,
} from './helpers';

type SelectOption = { value: string; label: string };
type CategoryOption = SelectOption & { searchText: string };

type DataUrls = {
  chartDataPositions: string;
  chartDataPrice: string;
  termStructure: string;
  monthlyChangeStats: string;
  calendarSpread: string;
  interCommoditySpread: string;
};

type UseDashboardStateParams = {
  dataUrls: DataUrls;
  activeTopKey: string;
  activeCategoryKey: string;
  setActiveCategoryKey: (value: string) => void;
  pillNav: NavItem[];
  activePillKey: string;
  setActivePillKey: (value: string) => void;
  metricOptions: SelectOption[];
  defaultMetricKey: string;
  metricContractMap: Record<string, string[]>;
  contractOptions: SelectOption[];
  categoryOptions: CategoryOption[];
};

const usePillViewState = (
  activeTopKey: string,
  pillNav: NavItem[],
  activePillKey: string,
  setActivePillKey: (value: string) => void,
) => {
  const [activePillView, setActivePillView] = useState<PillFunc>('comingSoon');

  useEffect(() => {
    const activeItem = pillNav.find((item) => item.key === activePillKey);
    setActivePillView(resolvePillAction(activeItem));
  }, [activePillKey, pillNav]);

  const handlePillClick = (item: NavItem) => {
    setActivePillKey(item.key);
    setActivePillView(resolvePillAction(item));
  };

  return {
    activePillView,
    handlePillClick,
    isFuturesView: activeTopKey === 'futures' || activeTopKey === '',
    isSeasonalChartView: activePillView === 'showSeasonChart',
    isMonthlyChangeView: activePillView === 'showMonthlyChangeTable',
    isTermStructureView: activePillView === 'showTermStructure',
    isCalendarSpreadView: activePillView === 'showCalendarSpread',
    isInterCommoditySpreadView: activePillView === 'showInterCommoditySpread',
  };
};

const useMetricContractState = (
  metricOptions: SelectOption[],
  defaultMetricKey: string,
  metricContractMap: Record<string, string[]>,
  contractOptions: SelectOption[],
) => {
  const [metricType, setMetricType] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [currentContractKey, setCurrentContractKey] = useState('');

  useEffect(() => {
    setCurrentContractKey(getCurrentContractKey());
  }, []);

  useEffect(() => {
    if (metricType || metricOptions.length === 0) {
      return;
    }
    const nextMetric = defaultMetricKey || metricOptions[0]?.value || '';
    if (nextMetric) {
      setMetricType(nextMetric);
    }
  }, [defaultMetricKey, metricOptions, metricType]);

  const activeContractKeys = useMemo(() => {
    if (!metricType) {
      return [];
    }
    const allowed = metricContractMap[metricType];
    return allowed && allowed.length > 0
      ? allowed
      : contractOptions.map((option) => option.value);
  }, [contractOptions, metricContractMap, metricType]);

  const activeContractOptions = useMemo(() => {
    if (activeContractKeys.length === 0) {
      return [];
    }
    const allowed = new Set(activeContractKeys);
    return contractOptions.filter((option) => allowed.has(option.value));
  }, [activeContractKeys, contractOptions]);

  useEffect(() => {
    if (!metricType || activeContractKeys.length === 0) {
      return;
    }
    const fallback = activeContractKeys[0];
    const nextDefault =
      currentContractKey && activeContractKeys.includes(currentContractKey)
        ? currentContractKey
        : fallback;
    if (!contractValue || !activeContractKeys.includes(contractValue)) {
      setContractValue(nextDefault);
    }
  }, [activeContractKeys, contractValue, currentContractKey, metricType]);

  return {
    metricType,
    setMetricType,
    contractValue,
    setContractValue,
    activeContractKeys,
    activeContractOptions,
  };
};

const useTermStructureState = () => {
  const [termStructureDateInput, setTermStructureDateInput] = useState(getTodayIsoDate);
  const [termStructureDateApplied, setTermStructureDateApplied] = useState(getTodayIsoDate);
  return {
    termStructureDateInput,
    setTermStructureDateInput,
    termStructureDateApplied,
    setTermStructureDateApplied,
  };
};

const useCalendarState = (activeContractKeys: string[]) => {
  const [calendarNearContractInput, setCalendarNearContractInput] = useState('');
  const [calendarFarContractInput, setCalendarFarContractInput] = useState('');
  const [calendarNearContractApplied, setCalendarNearContractApplied] = useState('');
  const [calendarFarContractApplied, setCalendarFarContractApplied] = useState('');

  useEffect(() => {
    if (activeContractKeys.length === 0) {
      return;
    }
    const fallbackNear = activeContractKeys[0];
    const fallbackFar = resolveSecondChoice(activeContractKeys, fallbackNear);

    if (!calendarNearContractInput || !activeContractKeys.includes(calendarNearContractInput)) {
      setCalendarNearContractInput(fallbackNear);
    }
    if (!calendarNearContractApplied || !activeContractKeys.includes(calendarNearContractApplied)) {
      setCalendarNearContractApplied(fallbackNear);
    }
    if (!calendarFarContractInput || !activeContractKeys.includes(calendarFarContractInput)) {
      setCalendarFarContractInput(fallbackFar);
    }
    if (!calendarFarContractApplied || !activeContractKeys.includes(calendarFarContractApplied)) {
      setCalendarFarContractApplied(fallbackFar);
    }
  }, [
    activeContractKeys,
    calendarFarContractApplied,
    calendarFarContractInput,
    calendarNearContractApplied,
    calendarNearContractInput,
  ]);

  return {
    calendarNearContractInput,
    setCalendarNearContractInput,
    calendarFarContractInput,
    setCalendarFarContractInput,
    calendarNearContractApplied,
    setCalendarNearContractApplied,
    calendarFarContractApplied,
    setCalendarFarContractApplied,
  };
};

const useInterCommodityContractState = (activeContractKeys: string[]) => {
  const [interCommodityLeftContractInput, setInterCommodityLeftContractInput] = useState('');
  const [interCommodityRightContractInput, setInterCommodityRightContractInput] = useState('');
  const [interCommodityLeftContractApplied, setInterCommodityLeftContractApplied] = useState('');
  const [interCommodityRightContractApplied, setInterCommodityRightContractApplied] = useState('');

  useEffect(() => {
    if (activeContractKeys.length === 0) {
      return;
    }
    const fallback = activeContractKeys[0];

    if (!interCommodityLeftContractInput || !activeContractKeys.includes(interCommodityLeftContractInput)) {
      setInterCommodityLeftContractInput(fallback);
    }
    if (!interCommodityLeftContractApplied || !activeContractKeys.includes(interCommodityLeftContractApplied)) {
      setInterCommodityLeftContractApplied(fallback);
    }
    if (!interCommodityRightContractInput || !activeContractKeys.includes(interCommodityRightContractInput)) {
      setInterCommodityRightContractInput(fallback);
    }
    if (!interCommodityRightContractApplied || !activeContractKeys.includes(interCommodityRightContractApplied)) {
      setInterCommodityRightContractApplied(fallback);
    }
  }, [
    activeContractKeys,
    interCommodityLeftContractApplied,
    interCommodityLeftContractInput,
    interCommodityRightContractApplied,
    interCommodityRightContractInput,
  ]);

  return {
    interCommodityLeftContractInput,
    setInterCommodityLeftContractInput,
    interCommodityRightContractInput,
    setInterCommodityRightContractInput,
    interCommodityLeftContractApplied,
    setInterCommodityLeftContractApplied,
    interCommodityRightContractApplied,
    setInterCommodityRightContractApplied,
  };
};

const useInterCommodityCategoryState = (
  categoryOptions: CategoryOption[],
  activeCategoryKey: string,
) => {
  const [interCommodityLeftCategoryInput, setInterCommodityLeftCategoryInput] = useState('');
  const [interCommodityRightCategoryInput, setInterCommodityRightCategoryInput] = useState('');
  const [interCommodityLeftCategoryApplied, setInterCommodityLeftCategoryApplied] = useState('');
  const [interCommodityRightCategoryApplied, setInterCommodityRightCategoryApplied] = useState('');

  useEffect(() => {
    if (categoryOptions.length === 0) {
      return;
    }
    const categoryKeys = categoryOptions.map((option) => option.value);
    const fallbackLeft =
      activeCategoryKey && categoryKeys.includes(activeCategoryKey)
        ? activeCategoryKey
        : categoryKeys[0];
    const fallbackRight = resolveSecondChoice(categoryKeys, fallbackLeft);

    if (!interCommodityLeftCategoryInput || !categoryKeys.includes(interCommodityLeftCategoryInput)) {
      setInterCommodityLeftCategoryInput(fallbackLeft);
    }
    if (!interCommodityLeftCategoryApplied || !categoryKeys.includes(interCommodityLeftCategoryApplied)) {
      setInterCommodityLeftCategoryApplied(fallbackLeft);
    }
    if (!interCommodityRightCategoryInput || !categoryKeys.includes(interCommodityRightCategoryInput)) {
      setInterCommodityRightCategoryInput(fallbackRight);
    }
    if (!interCommodityRightCategoryApplied || !categoryKeys.includes(interCommodityRightCategoryApplied)) {
      setInterCommodityRightCategoryApplied(fallbackRight);
    }
  }, [
    activeCategoryKey,
    categoryOptions,
    interCommodityLeftCategoryApplied,
    interCommodityLeftCategoryInput,
    interCommodityRightCategoryApplied,
    interCommodityRightCategoryInput,
  ]);

  return {
    interCommodityLeftCategoryInput,
    setInterCommodityLeftCategoryInput,
    interCommodityRightCategoryInput,
    setInterCommodityRightCategoryInput,
    interCommodityLeftCategoryApplied,
    setInterCommodityLeftCategoryApplied,
    interCommodityRightCategoryApplied,
    setInterCommodityRightCategoryApplied,
  };
};

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
  if (!isSeasonalChartView && !isTermStructureView && !isCalendarSpreadView && !isInterCommoditySpreadView) {
    return '';
  }
  if (!activeCategoryKey && !isInterCommoditySpreadView) {
    return '';
  }
  if (isInterCommoditySpreadView) {
    if (!interCommodityLeftCategoryApplied || !interCommodityRightCategoryApplied || !interCommodityLeftContractApplied || !interCommodityRightContractApplied) {
      return '';
    }
    if (interCommodityLeftCategoryApplied === interCommodityRightCategoryApplied && interCommodityLeftContractApplied === interCommodityRightContractApplied) {
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

const useDashboardDataUrls = ({
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
