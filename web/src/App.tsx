import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Layout } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import ChartPanel from './components/ChartPanel';
import ComingSoonPanel from './components/ComingSoonPanel';
import MonthlyChangePanel from './components/MonthlyChangePanel';
import PillNav from './components/PillNav';
import SideMenu from './components/SideMenu';
import TopNav from './components/TopNav';
import { siteConfig } from './config/site';
import { useCategories } from './hooks/useCategories';
import { useChartData } from './hooks/useChartData';
import { useFilters } from './hooks/useFilters';
import { useMonthlyChangeData } from './hooks/useMonthlyChangeData';
import { useNavigation } from './hooks/useNavigation';
import type { NavItem, PillFunc } from './types/nav';
import { resolvePillAction } from './utils/nav';

const { Header, Sider, Content } = Layout;

const { dataUrls, layout, brand, user } = siteConfig;

const getCurrentContractKey = () => {
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  return `c${month}`;
};

const getTodayIsoDate = () => dayjs().format('YYYY-MM-DD');

const toApiContract = (contract: string) => {
  if (/^c\d{2}$/.test(contract)) {
    return contract.slice(1);
  }
  return contract;
};

function App() {
  const { t } = useTranslation();
  const {
    sideMenuItems,
    sideOpenKeys,
    setSideOpenKeys,
    activeCategoryKey,
    setActiveCategoryKey,
    categoryLabelMap,
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

  const [activePillView, setActivePillView] = useState<PillFunc>('comingSoon');
  const [metricType, setMetricType] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [currentContractKey, setCurrentContractKey] = useState('');
  const [termStructureDateInput, setTermStructureDateInput] = useState(getTodayIsoDate);
  const [termStructureDateApplied, setTermStructureDateApplied] = useState(getTodayIsoDate);

  const isFuturesView = activeTopKey === 'futures' || activeTopKey === '';
  const isSeasonalChartView = activePillView === 'showSeasonChart';
  const isMonthlyChangeView = activePillView === 'showMonthlyChangeTable';
  const isTermStructureView = activePillView === 'showTermStructure';

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

  const chartDataUrl = useMemo(() => {
    if (!isSeasonalChartView && !isTermStructureView) {
      return '';
    }
    if (!activeCategoryKey) {
      return '';
    }
    if (isTermStructureView) {
      if (!termStructureDateApplied) {
        return '';
      }
      return `${dataUrls.termStructure}/${activeCategoryKey}.json?date=${termStructureDateApplied}`;
    }
    if (!contractValue) {
      return '';
    }
    if (!metricType) {
      return '';
    }
    const apiContract = toApiContract(contractValue);
    const baseUrl =
      metricType === 'price'
        ? dataUrls.chartDataPrice
        : dataUrls.chartDataPositions;
    return `${baseUrl}/${activeCategoryKey}/${apiContract}.json`;
  }, [
    activeCategoryKey,
    contractValue,
    isSeasonalChartView,
    isTermStructureView,
    metricType,
    termStructureDateApplied,
  ]);

  const monthlyChangeDataUrl = useMemo(() => {
    if (!isMonthlyChangeView) {
      return '';
    }
    if (!activeCategoryKey || !contractValue) {
      return '';
    }
    const apiContract = toApiContract(contractValue);
    return `${dataUrls.monthlyChangeStats}/${activeCategoryKey}/${apiContract}.json`;
  }, [activeCategoryKey, contractValue, isMonthlyChangeView]);

  const { chartData, chartSeries, chartAxes, chartTitles } = useChartData(chartDataUrl);
  const { rows: monthlyChangeRows } = useMonthlyChangeData(monthlyChangeDataUrl);

  const activeCategoryLabel = categoryLabelMap[activeCategoryKey] || t('common.feature');
  const activeContractLabel = contractLabelMap[contractValue] || contractValue;
  const effectiveMetricType = isTermStructureView ? 'price' : metricType;
  const activeMetricLabel = metricLabelMap[effectiveMetricType] || effectiveMetricType;

  const displayChartTitle = useMemo(
    () => {
      if (isTermStructureView) {
        return [activeCategoryLabel, activePillName].filter(Boolean).join(' ');
      }
      return [activeCategoryLabel, activeContractLabel, activeMetricLabel].filter(Boolean).join(' ');
    },
    [
      activeCategoryLabel,
      activeContractLabel,
      activeMetricLabel,
      activePillName,
      isTermStructureView,
    ],
  );

  const displayAxisLabel = useMemo(
    () =>
      effectiveMetricType === 'price'
        ? t('chart.axes.left.price')
        : t('chart.axes.left.positions'),
    [effectiveMetricType, t],
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
    () => ({
      ...chartAxes,
      left: {
        ...(chartAxes.left ?? {}),
        label: displayAxisLabel,
        labelKey: undefined,
      },
    }),
    [chartAxes, displayAxisLabel],
  );

  const monthlyChangeTitle = useMemo(
    () =>
      t('stats.monthlyChange.title', {
        category: activeCategoryLabel,
        contract: toApiContract(contractValue) || activeContractLabel,
      }),
    [activeCategoryLabel, activeContractLabel, contractValue, t],
  );

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

              {isSeasonalChartView || isTermStructureView ? (
                <ChartPanel
                  chartData={chartData}
                  chartSeries={chartSeries}
                  chartAxes={displayChartAxes}
                  chartTitles={displayChartTitles}
                  contractOptions={isTermStructureView ? [] : activeContractOptions}
                  contractValue={isTermStructureView ? '' : contractValue}
                  metricOptions={
                    isTermStructureView
                      ? []
                      : metricOptions
                  }
                  metricValue={effectiveMetricType}
                  onContractChange={setContractValue}
                  onMetricChange={(value) => {
                    if (!isTermStructureView) {
                      setMetricType(value);
                    }
                  }}
                  controls={
                    isTermStructureView ? (
                      <>
                        <DatePicker
                          className="filter"
                          allowClear={false}
                          value={dayjs(termStructureDateInput)}
                          onChange={(value) => {
                            if (!value) {
                              return;
                            }
                            setTermStructureDateInput(value.format('YYYY-MM-DD'));
                          }}
                        />
                        <Button
                          type="primary"
                          onClick={() => {
                            setTermStructureDateApplied(termStructureDateInput);
                          }}
                        >
                          {t('common.query')}
                        </Button>
                      </>
                    ) : undefined
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
