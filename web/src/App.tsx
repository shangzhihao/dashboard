import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { siteConfig } from './config/site';
import DashboardPage from './features/dashboard/DashboardPage';
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

  const pageProps = {
    translate: t,
    brandLogoText: brand.logoText,
    userAvatarText: user.avatarText,
    siderWidth: layout.siderWidth,
    ...categories,
    ...filters,
    ...navigation,
    ...dashboard,
    ...presentation,
    chartData: chart.chartData,
    monthlyChangeRows: monthlyChange.rows,
    activePillName,
    activeTopName,
  };

  return <DashboardPage {...pageProps} />;
}

export default App;
