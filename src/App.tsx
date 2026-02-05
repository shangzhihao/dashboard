import { useEffect, useMemo, useState } from 'react';
import { Input, Layout } from 'antd';
import { useTranslation } from 'react-i18next';
import './App.css';
import ChartPanel from './components/ChartPanel';
import ComingSoonPanel from './components/ComingSoonPanel';
import PillNav from './components/PillNav';
import SideMenu from './components/SideMenu';
import TopNav from './components/TopNav';
import { siteConfig } from './config/site';
import { useCategories } from './hooks/useCategories';
import { useChartData } from './hooks/useChartData';
import { useNavigation } from './hooks/useNavigation';
import type { NavItem, PillFunc } from './types/nav';
import { resolvePillAction } from './utils/nav';

const { Header, Sider, Content } = Layout;

const { dataUrls, layout, brand, user } = siteConfig;

function App() {
  const { t } = useTranslation();
  const { sideMenuItems, sideOpenKeys, setSideOpenKeys } = useCategories(dataUrls.categories);
  const {
    topNav,
    pillNav,
    activeTopKey,
    setActiveTopKey,
    activePillKey,
    setActivePillKey,
  } = useNavigation(dataUrls.navigation);
  const { chartData, chartSeries, chartAxes, chartTitles } = useChartData(dataUrls.chartData);

  const [activePillView, setActivePillView] = useState<PillFunc>('comingSoon');

  const isFuturesView = activeTopKey === 'futures' || activeTopKey === '';

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
          <Input className="search" placeholder={t('search.placeholder')} />
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
              />
            </Sider>

            <Content className="app-content">
              <PillNav items={pillNav} activeKey={activePillKey} onClick={handlePillClick} />

              {activePillView === 'showSeasonChart' ? (
                <ChartPanel
                  chartData={chartData}
                  chartSeries={chartSeries}
                  chartAxes={chartAxes}
                  chartTitles={chartTitles}
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
