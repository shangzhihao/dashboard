import { useEffect, useMemo, useState } from 'react';
import { Input, Layout } from 'antd';
import { useTranslation } from 'react-i18next';
import './App.css';
import ChartPanel from './components/ChartPanel';
import ComingSoonPanel from './components/ComingSoonPanel';
import LanguageSwitcher from './components/LanguageSwitcher';
import PillNav from './components/PillNav';
import SideMenu from './components/SideMenu';
import TopNav from './components/TopNav';
import { useCategories } from './hooks/useCategories';
import { useChartData } from './hooks/useChartData';
import { useNavigation } from './hooks/useNavigation';
import type { NavItem, PillFunc } from './types/nav';
import { resolvePillAction } from './utils/nav';

const { Header, Sider, Content } = Layout;

const categoriesUrl = `${process.env.PUBLIC_URL || ''}/data/categories.json`;
const navConfigUrl = `${process.env.PUBLIC_URL || ''}/data/navigation.json`;
const chartDataUrl = `${process.env.PUBLIC_URL || ''}/data/chart-data.json`;

function App() {
  const { t } = useTranslation();
  const { sideMenuItems, sideOpenKeys, setSideOpenKeys } = useCategories(categoriesUrl);
  const {
    topNav,
    pillNav,
    activeTopKey,
    setActiveTopKey,
    activePillKey,
    setActivePillKey,
  } = useNavigation(navConfigUrl);
  const { chartData, chartSeries, chartAxes, chartTitles } = useChartData(chartDataUrl);

  const [activePillView, setActivePillView] = useState<PillFunc>('comingSoon');

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

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-left">
          <div className="brand">
            <div className="logo">JN</div>
            <div className="brand-title">{t('brand.title')}</div>
          </div>
          <TopNav items={topNav} activeKey={activeTopKey} onChange={setActiveTopKey} />
        </div>
        <div className="header-right">
          <LanguageSwitcher />
          <Input className="search" placeholder={t('search.placeholder')} />
          <div className="avatar">JS</div>
        </div>
      </Header>

      <Layout className="app-shell">
        <Sider width={220} className="app-sider">
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
      </Layout>
    </Layout>
  );
}

export default App;
