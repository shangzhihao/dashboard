import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { siteConfig } from './config/site';
import DashboardPage from './features/dashboard/DashboardPage';
import type { DashboardPageModel } from './features/dashboard/models';
import { useChartPresentation } from './features/dashboard/useChartPresentation';
import { useDashboardState } from './features/dashboard/useDashboardState';
import { useCategories } from './hooks/useCategories';
import { useChartData } from './hooks/useChartData';
import { useFilters } from './hooks/useFilters';
import { useMonthlyChangeData } from './hooks/useMonthlyChangeData';
import { useNavigation } from './hooks/useNavigation';

const { dataUrls, layout, brand, user } = siteConfig;

function App() {
  const { t } = useTranslation();
  const categories = useCategories(dataUrls.categories);
  const filters = useFilters(dataUrls.filters);
  const navigation = useNavigation(dataUrls.navigation);
  const dashboard = useDashboardState({
    dataUrls,
    activeTopKey: navigation.activeTopKey,
    activeCategoryKey: categories.activeCategoryKey,
    setActiveCategoryKey: categories.setActiveCategoryKey,
    pillNav: navigation.pillNav,
    activePillKey: navigation.activePillKey,
    setActivePillKey: navigation.setActivePillKey,
    metricOptions: filters.metricOptions,
    defaultMetricKey: filters.defaultMetricKey,
    metricContractMap: filters.metricContractMap,
    contractOptions: filters.contractOptions,
    categoryOptions: categories.categoryOptions,
  });

  const chart = useChartData(dashboard.chartDataUrl);
  const monthlyChange = useMonthlyChangeData(dashboard.monthlyChangeDataUrl);

  const activePillName = useMemo(() => {
    const activeItem = navigation.pillNav.find((item) => item.key === navigation.activePillKey);
    return activeItem ? activeItem.nameKey ? t(activeItem.nameKey) : activeItem.name || t('common.feature') : t('common.feature');
  }, [navigation.activePillKey, navigation.pillNav, t]);

  const activeTopName = useMemo(() => {
    const activeItem = navigation.topNav.find((item) => item.key === navigation.activeTopKey);
    return activeItem ? activeItem.nameKey ? t(activeItem.nameKey) : activeItem.name || t('common.feature') : t('common.feature');
  }, [navigation.activeTopKey, navigation.topNav, t]);

  const presentation = useChartPresentation({
    chartSeries: chart.chartSeries,
    chartAxes: chart.chartAxes,
    chartTitles: chart.chartTitles,
    categoryOptions: categories.categoryOptions,
    categoryLabelMap: categories.categoryLabelMap,
    contractLabelMap: filters.contractLabelMap,
    metricLabelMap: filters.metricLabelMap,
    activeCategoryKey: categories.activeCategoryKey,
    activePillName,
    metricType: dashboard.metricType,
    contractValue: dashboard.contractValue,
    calendarNearContractApplied: dashboard.calendarNearContractApplied,
    calendarFarContractApplied: dashboard.calendarFarContractApplied,
    interCommodityLeftCategoryApplied: dashboard.interCommodityLeftCategoryApplied,
    interCommodityRightCategoryApplied: dashboard.interCommodityRightCategoryApplied,
    interCommodityLeftContractApplied: dashboard.interCommodityLeftContractApplied,
    interCommodityRightContractApplied: dashboard.interCommodityRightContractApplied,
    isTermStructureView: dashboard.isTermStructureView,
    isCalendarSpreadView: dashboard.isCalendarSpreadView,
    isInterCommoditySpreadView: dashboard.isInterCommoditySpreadView,
    translate: t,
  });

  const pageModel: DashboardPageModel = {
    header: {
      translate: t,
      brandLogoText: brand.logoText,
      userAvatarText: user.avatarText,
      topNav: navigation.topNav,
      activeTopKey: navigation.activeTopKey,
      setActiveTopKey: navigation.setActiveTopKey,
    },
    sidebar: {
      siderWidth: layout.siderWidth,
      sideMenuItems: categories.sideMenuItems,
      sideOpenKeys: categories.sideOpenKeys,
      setSideOpenKeys: categories.setSideOpenKeys,
      activeCategoryKey: categories.activeCategoryKey,
      setActiveCategoryKey: categories.setActiveCategoryKey,
    },
    navigation: {
      pillNav: navigation.pillNav,
      activePillKey: navigation.activePillKey,
      handlePillClick: dashboard.handlePillClick,
      activePillName,
      activeTopName,
      isFuturesView: dashboard.isFuturesView,
    },
    views: {
      isSeasonalChartView: dashboard.isSeasonalChartView,
      isMonthlyChangeView: dashboard.isMonthlyChangeView,
      isTermStructureView: dashboard.isTermStructureView,
      isCalendarSpreadView: dashboard.isCalendarSpreadView,
      isInterCommoditySpreadView: dashboard.isInterCommoditySpreadView,
    },
    chart: {
      chartData: chart.chartData,
      displayChartSeries: presentation.displayChartSeries,
      displayChartAxes: presentation.displayChartAxes,
      displayChartTitles: presentation.displayChartTitles,
      activeContractOptions: dashboard.activeContractOptions,
      contractValue: dashboard.contractValue,
      metricOptions: filters.metricOptions,
      effectiveMetricType: presentation.effectiveMetricType,
      setContractValue: dashboard.setContractValue,
      setMetricType: dashboard.setMetricType,
    },
    controls: {
      translate: t,
      isTermStructureView: dashboard.isTermStructureView,
      isCalendarSpreadView: dashboard.isCalendarSpreadView,
      isInterCommoditySpreadView: dashboard.isInterCommoditySpreadView,
      isSeasonalChartView: dashboard.isSeasonalChartView,
      isMonthlyChangeView: dashboard.isMonthlyChangeView,
      termStructureDateInput: dashboard.termStructureDateInput,
      setTermStructureDateInput: dashboard.setTermStructureDateInput,
      setTermStructureDateApplied: dashboard.setTermStructureDateApplied,
      calendarNearContractInput: dashboard.calendarNearContractInput,
      calendarFarContractInput: dashboard.calendarFarContractInput,
      setCalendarNearContractInput: dashboard.setCalendarNearContractInput,
      setCalendarFarContractInput: dashboard.setCalendarFarContractInput,
      setCalendarNearContractApplied: dashboard.setCalendarNearContractApplied,
      setCalendarFarContractApplied: dashboard.setCalendarFarContractApplied,
      interCommodityLeftCategoryInput: dashboard.interCommodityLeftCategoryInput,
      interCommodityRightCategoryInput: dashboard.interCommodityRightCategoryInput,
      setInterCommodityLeftCategoryInput: dashboard.setInterCommodityLeftCategoryInput,
      setInterCommodityRightCategoryInput: dashboard.setInterCommodityRightCategoryInput,
      setInterCommodityLeftCategoryApplied: dashboard.setInterCommodityLeftCategoryApplied,
      setInterCommodityRightCategoryApplied: dashboard.setInterCommodityRightCategoryApplied,
      interCommodityLeftContractInput: dashboard.interCommodityLeftContractInput,
      interCommodityRightContractInput: dashboard.interCommodityRightContractInput,
      setInterCommodityLeftContractInput: dashboard.setInterCommodityLeftContractInput,
      setInterCommodityRightContractInput: dashboard.setInterCommodityRightContractInput,
      setInterCommodityLeftContractApplied: dashboard.setInterCommodityLeftContractApplied,
      setInterCommodityRightContractApplied: dashboard.setInterCommodityRightContractApplied,
      activeContractKeys: dashboard.activeContractKeys,
      activeContractOptions: dashboard.activeContractOptions,
      categoryOptions: categories.categoryOptions,
      setActiveCategoryKey: categories.setActiveCategoryKey,
    },
    monthly: {
      monthlyChangeTitle: presentation.monthlyChangeTitle,
      monthlyChangeRows: monthlyChange.rows,
      contractOptions: dashboard.activeContractOptions,
      contractValue: dashboard.contractValue,
      setContractValue: dashboard.setContractValue,
    },
  };

  return <DashboardPage model={pageModel} />;
}

export default App;
