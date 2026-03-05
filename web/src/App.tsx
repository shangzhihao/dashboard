import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Layout, Select } from 'antd';
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
import type { ChartSeriesConfig } from './types/chart';
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

const toTermStructureDatePath = (value: string) => {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) {
    return '';
  }
  return `${matched[1]}/${matched[2]}/${matched[3]}`;
};

const resolveSecondChoice = (choices: string[], first: string) =>
  choices.find((choice) => choice !== first) || first;

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
  const [interCommodityRightCategoryApplied, setInterCommodityRightCategoryApplied] =
    useState('');
  const [interCommodityLeftContractInput, setInterCommodityLeftContractInput] = useState('');
  const [interCommodityRightContractInput, setInterCommodityRightContractInput] = useState('');
  const [interCommodityLeftContractApplied, setInterCommodityLeftContractApplied] = useState('');
  const [interCommodityRightContractApplied, setInterCommodityRightContractApplied] =
    useState('');

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
    calendarFarContractApplied,
    calendarNearContractApplied,
    contractValue,
    isCalendarSpreadView,
    isInterCommoditySpreadView,
    isSeasonalChartView,
    isTermStructureView,
    interCommodityLeftCategoryApplied,
    interCommodityLeftContractApplied,
    interCommodityRightCategoryApplied,
    interCommodityRightContractApplied,
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

  const displayChartTitle = useMemo(
    () => {
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
    },
    [
      activeCategoryLabel,
      activeContractLabel,
      activePillName,
      activeMetricLabel,
      calendarFarContractApplied,
      calendarNearContractApplied,
      categoryLabelMap,
      categoryOptionLabelMap,
      isCalendarSpreadView,
      isInterCommoditySpreadView,
      isTermStructureView,
      interCommodityLeftCategoryApplied,
      interCommodityLeftContractApplied,
      interCommodityRightCategoryApplied,
      interCommodityRightContractApplied,
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

  const displayChartSeries = useMemo<ChartSeriesConfig[]>(
    () => {
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
    },
    [
      categoryLabelMap,
      chartSeries,
      interCommodityLeftCategoryApplied,
      interCommodityLeftContractApplied,
      interCommodityRightCategoryApplied,
      interCommodityRightContractApplied,
      isInterCommoditySpreadView,
    ],
  );

  const monthlyChangeTitle = useMemo(
    () =>
      t('stats.monthlyChange.title', {
        category: activeCategoryLabel,
        contract: toApiContract(contractValue) || activeContractLabel,
      }),
    [activeCategoryLabel, activeContractLabel, contractValue, t],
  );

  const filterCategoryOption = (
    input: string,
    option?: { label?: string | number; searchText?: string },
  ) => {
    const keyword = input.trim().toLowerCase();
    if (!keyword) {
      return true;
    }
    const label = String(option?.label ?? '').toLowerCase();
    const searchText = String(option?.searchText ?? '');
    return label.includes(keyword) || searchText.includes(keyword);
  };

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
                    if (
                      !isTermStructureView &&
                      !isCalendarSpreadView &&
                      !isInterCommoditySpreadView
                    ) {
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
                    ) : isCalendarSpreadView ? (
                      <>
                        <Select
                          className="filter"
                          value={calendarNearContractInput}
                          onChange={(value) => {
                            setCalendarNearContractInput(value);
                            if (value === calendarFarContractInput) {
                              setCalendarFarContractInput(
                                resolveSecondChoice(activeContractKeys, value),
                              );
                            }
                          }}
                          options={activeContractOptions}
                          placeholder={t('chart.calendarSpread.nearContract')}
                        />
                        <Select
                          className="filter"
                          value={calendarFarContractInput}
                          onChange={(value) => {
                            setCalendarFarContractInput(value);
                            if (value === calendarNearContractInput) {
                              setCalendarNearContractInput(
                                resolveSecondChoice(activeContractKeys, value),
                              );
                            }
                          }}
                          options={activeContractOptions}
                          placeholder={t('chart.calendarSpread.farContract')}
                        />
                        <Button
                          type="primary"
                          disabled={
                            !calendarNearContractInput ||
                            !calendarFarContractInput ||
                            calendarNearContractInput === calendarFarContractInput
                          }
                          onClick={() => {
                            setCalendarNearContractApplied(calendarNearContractInput);
                            setCalendarFarContractApplied(calendarFarContractInput);
                          }}
                        >
                          {t('common.query')}
                        </Button>
                      </>
                    ) : isInterCommoditySpreadView ? (
                      <>
                        <Select
                          className="filter"
                          showSearch
                          optionFilterProp="label"
                          filterOption={(input, option) =>
                            filterCategoryOption(input, option as { label?: string; searchText?: string })
                          }
                          value={interCommodityLeftCategoryInput}
                          onChange={(value) => {
                            const categoryKeys = categoryOptions.map((option) => option.value);
                            setInterCommodityLeftCategoryInput(value);
                            setActiveCategoryKey(value);
                            if (value === interCommodityRightCategoryInput) {
                              setInterCommodityRightCategoryInput(
                                resolveSecondChoice(categoryKeys, value),
                              );
                            }
                          }}
                          options={categoryOptions}
                          placeholder={t('chart.interCommoditySpread.leftCategory')}
                        />
                        <Select
                          className="filter"
                          value={interCommodityLeftContractInput}
                          onChange={setInterCommodityLeftContractInput}
                          options={activeContractOptions}
                          placeholder={t('chart.interCommoditySpread.leftContract')}
                        />
                        <Select
                          className="filter"
                          showSearch
                          optionFilterProp="label"
                          filterOption={(input, option) =>
                            filterCategoryOption(input, option as { label?: string; searchText?: string })
                          }
                          value={interCommodityRightCategoryInput}
                          onChange={(value) => {
                            const categoryKeys = categoryOptions.map((option) => option.value);
                            setInterCommodityRightCategoryInput(value);
                            if (value === interCommodityLeftCategoryInput) {
                              const fallbackLeft = resolveSecondChoice(categoryKeys, value);
                              setInterCommodityLeftCategoryInput(fallbackLeft);
                              setActiveCategoryKey(fallbackLeft);
                            }
                          }}
                          options={categoryOptions}
                          placeholder={t('chart.interCommoditySpread.rightCategory')}
                        />
                        <Select
                          className="filter"
                          value={interCommodityRightContractInput}
                          onChange={setInterCommodityRightContractInput}
                          options={activeContractOptions}
                          placeholder={t('chart.interCommoditySpread.rightContract')}
                        />
                        <Button
                          type="primary"
                          disabled={
                            !interCommodityLeftCategoryInput ||
                            !interCommodityRightCategoryInput ||
                            !interCommodityLeftContractInput ||
                            !interCommodityRightContractInput ||
                            (interCommodityLeftCategoryInput === interCommodityRightCategoryInput &&
                              interCommodityLeftContractInput === interCommodityRightContractInput)
                          }
                          onClick={() => {
                            setInterCommodityLeftCategoryApplied(interCommodityLeftCategoryInput);
                            setInterCommodityRightCategoryApplied(interCommodityRightCategoryInput);
                            setInterCommodityLeftContractApplied(interCommodityLeftContractInput);
                            setInterCommodityRightContractApplied(interCommodityRightContractInput);
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
