import { useMemo } from 'react';
import { Layout } from 'antd';
import { useTranslation } from 'react-i18next';
import ChartPanel from './components/ChartPanel';
import ComingSoonPanel from './components/ComingSoonPanel';
import MonthlyChangePanel from './components/MonthlyChangePanel';
import PillNav from './components/PillNav';
import SideMenu from './components/SideMenu';
import TopNav from './components/TopNav';
import { siteConfig } from './config/site';
import DashboardChartControls from './features/dashboard/DashboardChartControls';
import { useChartPresentation } from './features/dashboard/useChartPresentation';
import { useDashboardState } from './features/dashboard/useDashboardState';
import { useCategories } from './hooks/useCategories';
import { useChartData } from './hooks/useChartData';
import { useFilters } from './hooks/useFilters';
import { useMonthlyChangeData } from './hooks/useMonthlyChangeData';
import { useNavigation } from './hooks/useNavigation';

const { Header, Sider, Content } = Layout;
const { dataUrls, layout, brand, user } = siteConfig;

function App() {
  const { t } = useTranslation();
  const {
    sideMenuItems,
    sideOpenKeys,
    setSideOpenKeys,
    activeCategoryKey,
    setActiveCategoryKey,
    categoryLabelMap,
    categoryOptions,
  } = useCategories(dataUrls.categories);
  const {
    metricOptions,
    contractOptions,
    metricContractMap,
    contractLabelMap,
    metricLabelMap,
    defaultMetricKey,
  } = useFilters(dataUrls.filters);
  const {
    topNav,
    pillNav,
    activeTopKey,
    setActiveTopKey,
    activePillKey,
    setActivePillKey,
  } = useNavigation(dataUrls.navigation);

  const {
    handlePillClick,
    metricType,
    setMetricType,
    contractValue,
    setContractValue,
    termStructureDateInput,
    setTermStructureDateInput,
    setTermStructureDateApplied,
    calendarNearContractInput,
    setCalendarNearContractInput,
    calendarFarContractInput,
    setCalendarFarContractInput,
    calendarNearContractApplied,
    calendarFarContractApplied,
    setCalendarNearContractApplied,
    setCalendarFarContractApplied,
    interCommodityLeftCategoryInput,
    setInterCommodityLeftCategoryInput,
    interCommodityRightCategoryInput,
    setInterCommodityRightCategoryInput,
    interCommodityLeftCategoryApplied,
    interCommodityRightCategoryApplied,
    setInterCommodityLeftCategoryApplied,
    setInterCommodityRightCategoryApplied,
    interCommodityLeftContractInput,
    setInterCommodityLeftContractInput,
    interCommodityRightContractInput,
    setInterCommodityRightContractInput,
    interCommodityLeftContractApplied,
    interCommodityRightContractApplied,
    setInterCommodityLeftContractApplied,
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
  } = useDashboardState({
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
  });

  const { chartData, chartSeries, chartAxes, chartTitles } = useChartData(chartDataUrl);
  const { rows: monthlyChangeRows } = useMonthlyChangeData(monthlyChangeDataUrl);

  const activePillName = useMemo(() => {
    const activeItem = pillNav.find((item) => item.key === activePillKey);
    if (!activeItem) {
      return t('common.feature');
    }
    return activeItem.nameKey ? t(activeItem.nameKey) : activeItem.name || t('common.feature');
  }, [activePillKey, pillNav, t]);

  const activeTopName = useMemo(() => {
    const activeItem = topNav.find((item) => item.key === activeTopKey);
    if (!activeItem) {
      return t('common.feature');
    }
    return activeItem.nameKey ? t(activeItem.nameKey) : activeItem.name || t('common.feature');
  }, [activeTopKey, topNav, t]);

  const {
    effectiveMetricType,
    displayChartTitles,
    displayChartAxes,
    displayChartSeries,
    monthlyChangeTitle,
  } = useChartPresentation({
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
    translate: t,
  });

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-left">
          <div className="brand">
            <div className="logo">{brand.logoText}</div>
            <div className="brand-title">{t('brand.title')}</div>
          </div>
          <TopNav items={topNav} activeKey={activeTopKey} onChange={setActiveTopKey} />
        </div>
        <div className="header-right">
          <div className="avatar">{user.avatarText}</div>
        </div>
      </Header>

      <Layout className="app-shell">
        {isFuturesView ? (
          <>
            <Sider width={layout.siderWidth} className="app-sider">
              <div className="side-header">{t('side.header')}</div>
              <SideMenu
                items={sideMenuItems}
                openKeys={sideOpenKeys}
                onOpenChange={setSideOpenKeys}
                selectedKey={activeCategoryKey}
                onSelectKey={setActiveCategoryKey}
              />
            </Sider>

            <Content className="app-content">
              <PillNav items={pillNav} activeKey={activePillKey} onClick={handlePillClick} />

              {isSeasonalChartView ||
              isTermStructureView ||
              isCalendarSpreadView ||
              isInterCommoditySpreadView ? (
                <ChartPanel
                  chartData={chartData}
                  chartSeries={displayChartSeries}
                  chartAxes={displayChartAxes}
                  chartTitles={displayChartTitles}
                  contractOptions={
                    isTermStructureView || isCalendarSpreadView || isInterCommoditySpreadView
                      ? []
                      : activeContractOptions
                  }
                  contractValue={
                    isTermStructureView || isCalendarSpreadView || isInterCommoditySpreadView
                      ? ''
                      : contractValue
                  }
                  metricOptions={
                    isTermStructureView || isCalendarSpreadView || isInterCommoditySpreadView
                      ? []
                      : metricOptions
                  }
                  metricValue={effectiveMetricType}
                  onContractChange={setContractValue}
                  onMetricChange={(value) => {
                    if (!isTermStructureView && !isCalendarSpreadView && !isInterCommoditySpreadView) {
                      setMetricType(value);
                    }
                  }}
                  controls={
                    <DashboardChartControls
                      isTermStructureView={isTermStructureView}
                      isCalendarSpreadView={isCalendarSpreadView}
                      isInterCommoditySpreadView={isInterCommoditySpreadView}
                      termStructureDateInput={termStructureDateInput}
                      setTermStructureDateInput={setTermStructureDateInput}
                      setTermStructureDateApplied={setTermStructureDateApplied}
                      calendarNearContractInput={calendarNearContractInput}
                      calendarFarContractInput={calendarFarContractInput}
                      setCalendarNearContractInput={setCalendarNearContractInput}
                      setCalendarFarContractInput={setCalendarFarContractInput}
                      setCalendarNearContractApplied={setCalendarNearContractApplied}
                      setCalendarFarContractApplied={setCalendarFarContractApplied}
                      interCommodityLeftCategoryInput={interCommodityLeftCategoryInput}
                      interCommodityRightCategoryInput={interCommodityRightCategoryInput}
                      setInterCommodityLeftCategoryInput={setInterCommodityLeftCategoryInput}
                      setInterCommodityRightCategoryInput={setInterCommodityRightCategoryInput}
                      setInterCommodityLeftCategoryApplied={setInterCommodityLeftCategoryApplied}
                      setInterCommodityRightCategoryApplied={setInterCommodityRightCategoryApplied}
                      interCommodityLeftContractInput={interCommodityLeftContractInput}
                      interCommodityRightContractInput={interCommodityRightContractInput}
                      setInterCommodityLeftContractInput={setInterCommodityLeftContractInput}
                      setInterCommodityRightContractInput={setInterCommodityRightContractInput}
                      setInterCommodityLeftContractApplied={setInterCommodityLeftContractApplied}
                      setInterCommodityRightContractApplied={setInterCommodityRightContractApplied}
                      activeContractKeys={activeContractKeys}
                      activeContractOptions={activeContractOptions}
                      categoryOptions={categoryOptions}
                      setActiveCategoryKey={setActiveCategoryKey}
                      translate={t}
                    />
                  }
                />
              ) : isMonthlyChangeView ? (
                <MonthlyChangePanel
                  title={monthlyChangeTitle}
                  rows={monthlyChangeRows}
                  contractOptions={activeContractOptions}
                  contractValue={contractValue}
                  onContractChange={setContractValue}
                />
              ) : (
                <ComingSoonPanel title={activePillName} />
              )}
            </Content>
          </>
        ) : (
          <Content className="app-content">
            <ComingSoonPanel title={activeTopName} />
          </Content>
        )}
      </Layout>
    </Layout>
  );
}

export default App;
