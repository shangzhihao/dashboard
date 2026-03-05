import { Layout } from 'antd';
import ChartPanel from '../../components/ChartPanel';
import ComingSoonPanel from '../../components/ComingSoonPanel';
import MonthlyChangePanel from '../../components/MonthlyChangePanel';
import PillNav from '../../components/PillNav';
import SideMenu from '../../components/SideMenu';
import TopNav from '../../components/TopNav';
import DashboardChartControls from './DashboardChartControls';
import type {
  DashboardChartModel,
  DashboardHeaderModel,
  DashboardNavigationModel,
  DashboardPageModel,
  DashboardSidebarModel,
  DashboardViewFlags,
} from './models';

const { Header, Sider, Content } = Layout;

type DashboardPageProps = {
  model: DashboardPageModel;
};

const DashboardHeader = ({
  translate,
  brandLogoText,
  userAvatarText,
  topNav,
  activeTopKey,
  setActiveTopKey,
}: DashboardHeaderModel) => (
  <Header className="app-header">
    <div className="header-left">
      <div className="brand">
        <div className="logo">{brandLogoText}</div>
        <div className="brand-title">{translate('brand.title')}</div>
      </div>
      <TopNav items={topNav} activeKey={activeTopKey} onChange={setActiveTopKey} />
    </div>
    <div className="header-right">
      <div className="avatar">{userAvatarText}</div>
    </div>
  </Header>
);

const DashboardMainPanel = ({
  views,
  chart,
  controls,
  monthly,
  navigation,
}: {
  views: DashboardViewFlags;
  chart: DashboardChartModel;
  controls: DashboardPageModel['controls'];
  monthly: DashboardPageModel['monthly'];
  navigation: DashboardNavigationModel;
}) => {
  if (views.isMonthlyChangeView) {
    return (
      <MonthlyChangePanel
        title={monthly.monthlyChangeTitle}
        rows={monthly.monthlyChangeRows}
        contractOptions={monthly.contractOptions}
        contractValue={monthly.contractValue}
        onContractChange={monthly.setContractValue}
      />
    );
  }

  if (
    !views.isSeasonalChartView &&
    !views.isTermStructureView &&
    !views.isCalendarSpreadView &&
    !views.isInterCommoditySpreadView
  ) {
    return <ComingSoonPanel title={navigation.activePillName} />;
  }

  const disableFilterSelectors =
    views.isTermStructureView || views.isCalendarSpreadView || views.isInterCommoditySpreadView;

  return (
    <ChartPanel
      chartData={chart.chartData}
      chartSeries={chart.displayChartSeries}
      chartAxes={chart.displayChartAxes}
      chartTitles={chart.displayChartTitles}
      contractOptions={disableFilterSelectors ? [] : chart.activeContractOptions}
      contractValue={disableFilterSelectors ? '' : chart.contractValue}
      metricOptions={disableFilterSelectors ? [] : chart.metricOptions}
      metricValue={chart.effectiveMetricType}
      onContractChange={chart.setContractValue}
      onMetricChange={(value) => {
        if (!disableFilterSelectors) {
          chart.setMetricType(value);
        }
      }}
      controls={<DashboardChartControls model={controls} />}
    />
  );
};

const FuturesView = ({
  header,
  sidebar,
  navigation,
  views,
  chart,
  controls,
  monthly,
}: DashboardPageModel) => (
  <>
    <Sider width={sidebar.siderWidth} className="app-sider">
      <div className="side-header">{header.translate('side.header')}</div>
      <SideMenu
        items={sidebar.sideMenuItems}
        openKeys={sidebar.sideOpenKeys}
        onOpenChange={sidebar.setSideOpenKeys}
        selectedKey={sidebar.activeCategoryKey}
        onSelectKey={sidebar.setActiveCategoryKey}
      />
    </Sider>

    <Content className="app-content">
      <PillNav
        items={navigation.pillNav}
        activeKey={navigation.activePillKey}
        onClick={navigation.handlePillClick}
      />
      <DashboardMainPanel
        views={views}
        chart={chart}
        controls={controls}
        monthly={monthly}
        navigation={navigation}
      />
    </Content>
  </>
);

const DashboardPage = ({ model }: DashboardPageProps) => (
  <Layout className="app-layout">
    <DashboardHeader
      translate={model.header.translate}
      brandLogoText={model.header.brandLogoText}
      userAvatarText={model.header.userAvatarText}
      topNav={model.header.topNav}
      activeTopKey={model.header.activeTopKey}
      setActiveTopKey={model.header.setActiveTopKey}
    />

    <Layout className="app-shell">
      {model.navigation.isFuturesView ? (
        <FuturesView
          header={model.header}
          sidebar={model.sidebar}
          navigation={model.navigation}
          views={model.views}
          chart={model.chart}
          controls={model.controls}
          monthly={model.monthly}
        />
      ) : (
        <Content className="app-content">
          <ComingSoonPanel title={model.navigation.activeTopName} />
        </Content>
      )}
    </Layout>
  </Layout>
);

export default DashboardPage;
