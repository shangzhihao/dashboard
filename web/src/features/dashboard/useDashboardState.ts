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
  const [activePillView, setActivePillView] = useState<PillFunc>('comingSoon');
  const [metricType, setMetricType] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [currentContractKey, setCurrentContractKey] = useState('');
  const [termStructureDateInput, setTermStructureDateInput] = useState(getTodayIsoDate);
  const [termStructureDateApplied, setTermStructureDateApplied] = useState(getTodayIsoDate);
  const [calendarNearContractInput, setCalendarNearContractInput] = useState('');
  const [calendarFarContractInput, setCalendarFarContractInput] = useState('');
  const [calendarNearContractApplied, setCalendarNearContractApplied] = useState('');
  const [calendarFarContractApplied, setCalendarFarContractApplied] = useState('');
  const [interCommodityLeftCategoryInput, setInterCommodityLeftCategoryInput] = useState('');
  const [interCommodityRightCategoryInput, setInterCommodityRightCategoryInput] = useState('');
  const [interCommodityLeftCategoryApplied, setInterCommodityLeftCategoryApplied] = useState('');
  const [interCommodityRightCategoryApplied, setInterCommodityRightCategoryApplied] = useState('');
  const [interCommodityLeftContractInput, setInterCommodityLeftContractInput] = useState('');
  const [interCommodityRightContractInput, setInterCommodityRightContractInput] = useState('');
  const [interCommodityLeftContractApplied, setInterCommodityLeftContractApplied] = useState('');
  const [interCommodityRightContractApplied, setInterCommodityRightContractApplied] = useState('');

  const isFuturesView = activeTopKey === 'futures' || activeTopKey === '';
  const isSeasonalChartView = activePillView === 'showSeasonChart';
  const isMonthlyChangeView = activePillView === 'showMonthlyChangeTable';
  const isTermStructureView = activePillView === 'showTermStructure';
  const isCalendarSpreadView = activePillView === 'showCalendarSpread';
  const isInterCommoditySpreadView = activePillView === 'showInterCommoditySpread';

  useEffect(() => {
    setCurrentContractKey(getCurrentContractKey());
  }, []);

  useEffect(() => {
    const activeItem = pillNav.find((item) => item.key === activePillKey);
    setActivePillView(resolvePillAction(activeItem));
  }, [activePillKey, pillNav]);

  const handlePillClick = (item: NavItem) => {
    setActivePillKey(item.key);
    setActivePillView(resolvePillAction(item));
  };

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
    if (allowed && allowed.length > 0) {
      return allowed;
    }
    return contractOptions.map((option) => option.value);
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
    const currentMonth = currentContractKey;
    const fallback = activeContractKeys[0];
    const nextDefault =
      currentMonth && activeContractKeys.includes(currentMonth) ? currentMonth : fallback;
    if (!contractValue || !activeContractKeys.includes(contractValue)) {
      setContractValue(nextDefault);
    }
  }, [activeContractKeys, contractValue, currentContractKey, metricType]);

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

    if (!interCommodityLeftContractInput || !activeContractKeys.includes(interCommodityLeftContractInput)) {
      setInterCommodityLeftContractInput(fallbackNear);
    }
    if (
      !interCommodityLeftContractApplied ||
      !activeContractKeys.includes(interCommodityLeftContractApplied)
    ) {
      setInterCommodityLeftContractApplied(fallbackNear);
    }

    if (!interCommodityRightContractInput || !activeContractKeys.includes(interCommodityRightContractInput)) {
      setInterCommodityRightContractInput(fallbackNear);
    }
    if (
      !interCommodityRightContractApplied ||
      !activeContractKeys.includes(interCommodityRightContractApplied)
    ) {
      setInterCommodityRightContractApplied(fallbackNear);
    }
  }, [
    activeContractKeys,
    calendarFarContractApplied,
    calendarFarContractInput,
    calendarNearContractApplied,
    calendarNearContractInput,
    interCommodityLeftContractApplied,
    interCommodityLeftContractInput,
    interCommodityRightContractApplied,
    interCommodityRightContractInput,
  ]);

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
    if (
      !interCommodityLeftCategoryApplied ||
      !categoryKeys.includes(interCommodityLeftCategoryApplied)
    ) {
      setInterCommodityLeftCategoryApplied(fallbackLeft);
    }

    if (!interCommodityRightCategoryInput || !categoryKeys.includes(interCommodityRightCategoryInput)) {
      setInterCommodityRightCategoryInput(fallbackRight);
    }
    if (
      !interCommodityRightCategoryApplied ||
      !categoryKeys.includes(interCommodityRightCategoryApplied)
    ) {
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

  const chartDataUrl = useMemo(() => {
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
      const leftContract = toApiContract(interCommodityLeftContractApplied);
      const rightContract = toApiContract(interCommodityRightContractApplied);
      return `${dataUrls.interCommoditySpread}/${interCommodityLeftCategoryApplied}/${leftContract}/${interCommodityRightCategoryApplied}/${rightContract}.json`;
    }

    if (isCalendarSpreadView) {
      if (!calendarNearContractApplied || !calendarFarContractApplied) {
        return '';
      }
      const nearContract = toApiContract(calendarNearContractApplied);
      const farContract = toApiContract(calendarFarContractApplied);
      return `${dataUrls.calendarSpread}/${activeCategoryKey}/${nearContract}/${farContract}.json`;
    }

    if (isTermStructureView) {
      if (!termStructureDateApplied) {
        return '';
      }
      const datePath = toTermStructureDatePath(termStructureDateApplied);
      if (!datePath) {
        return '';
      }
      return `${dataUrls.termStructure}/${activeCategoryKey}/${datePath}.json`;
    }

    if (!contractValue || !metricType) {
      return '';
    }
    const apiContract = toApiContract(contractValue);
    const baseUrl = metricType === 'price' ? dataUrls.chartDataPrice : dataUrls.chartDataPositions;
    return `${baseUrl}/${activeCategoryKey}/${apiContract}.json`;
  }, [
    activeCategoryKey,
    calendarFarContractApplied,
    calendarNearContractApplied,
    contractValue,
    dataUrls.calendarSpread,
    dataUrls.chartDataPositions,
    dataUrls.chartDataPrice,
    dataUrls.interCommoditySpread,
    dataUrls.termStructure,
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
  ]);

  const monthlyChangeDataUrl = useMemo(() => {
    if (!isMonthlyChangeView || !activeCategoryKey || !contractValue) {
      return '';
    }
    const apiContract = toApiContract(contractValue);
    return `${dataUrls.monthlyChangeStats}/${activeCategoryKey}/${apiContract}.json`;
  }, [activeCategoryKey, contractValue, dataUrls.monthlyChangeStats, isMonthlyChangeView]);

  return {
    activePillView,
    handlePillClick,
    metricType,
    setMetricType,
    contractValue,
    setContractValue,
    termStructureDateInput,
    setTermStructureDateInput,
    termStructureDateApplied,
    setTermStructureDateApplied,
    calendarNearContractInput,
    setCalendarNearContractInput,
    calendarFarContractInput,
    setCalendarFarContractInput,
    calendarNearContractApplied,
    setCalendarNearContractApplied,
    calendarFarContractApplied,
    setCalendarFarContractApplied,
    interCommodityLeftCategoryInput,
    setInterCommodityLeftCategoryInput,
    interCommodityRightCategoryInput,
    setInterCommodityRightCategoryInput,
    interCommodityLeftCategoryApplied,
    setInterCommodityLeftCategoryApplied,
    interCommodityRightCategoryApplied,
    setInterCommodityRightCategoryApplied,
    interCommodityLeftContractInput,
    setInterCommodityLeftContractInput,
    interCommodityRightContractInput,
    setInterCommodityRightContractInput,
    interCommodityLeftContractApplied,
    setInterCommodityLeftContractApplied,
    interCommodityRightContractApplied,
    setInterCommodityRightContractApplied,
    isFuturesView,
    isSeasonalChartView,
    isMonthlyChangeView,
    isTermStructureView,
    isCalendarSpreadView,
    isInterCommoditySpreadView,
    activeContractKeys,
    activeContractOptions,
    chartDataUrl,
    monthlyChangeDataUrl,
    setActiveCategoryKey,
    categoryOptions,
  };
};
