import { Layout } from 'antd';
import type { MenuProps } from 'antd';
import ChartPanel from '../../components/ChartPanel';
import ComingSoonPanel from '../../components/ComingSoonPanel';
import MonthlyChangePanel from '../../components/MonthlyChangePanel';
import PillNav from '../../components/PillNav';
import SideMenu from '../../components/SideMenu';
import TopNav from '../../components/TopNav';
import type { ChartAxesConfig, ChartDatum, ChartSeriesConfig, ChartTitlesConfig } from '../../types/chart';
import type { MonthlyChangeRow } from '../../types/monthlyChange';
import type { NavItem } from '../../types/nav';
import DashboardChartControls from './DashboardChartControls';

const { Header, Sider, Content } = Layout;

type Translate = (key: string, options?: Record<string, unknown>) => string;

type DashboardPageProps = {
  translate: Translate;
  brandLogoText: string;
  userAvatarText: string;
  siderWidth: number;
  topNav: NavItem[];
  activeTopKey: string;
  setActiveTopKey: (value: string) => void;
  sideMenuItems: NonNullable<MenuProps['items']>;
  sideOpenKeys: string[];
  setSideOpenKeys: (keys: string[]) => void;
  activeCategoryKey: string;
  setActiveCategoryKey: (value: string) => void;
  pillNav: NavItem[];
  activePillKey: string;
  handlePillClick: (item: NavItem) => void;
  activePillName: string;
  activeTopName: string;
  isFuturesView: boolean;
  isSeasonalChartView: boolean;
  isMonthlyChangeView: boolean;
  isTermStructureView: boolean;
  isCalendarSpreadView: boolean;
  isInterCommoditySpreadView: boolean;
  chartData: ChartDatum[];
  displayChartSeries: ChartSeriesConfig[];
  displayChartAxes: ChartAxesConfig;
  displayChartTitles: ChartTitlesConfig;
  activeContractOptions: Array<{ value: string; label: string }>;
  contractValue: string;
  metricOptions: Array<{ value: string; label: string }>;
  effectiveMetricType: string;
  setContractValue: (value: string) => void;
  setMetricType: (value: string) => void;
  termStructureDateInput: string;
  setTermStructureDateInput: (value: string) => void;
  setTermStructureDateApplied: (value: string) => void;
  calendarNearContractInput: string;
  calendarFarContractInput: string;
  setCalendarNearContractInput: (value: string) => void;
  setCalendarFarContractInput: (value: string) => void;
  setCalendarNearContractApplied: (value: string) => void;
  setCalendarFarContractApplied: (value: string) => void;
  interCommodityLeftCategoryInput: string;
  interCommodityRightCategoryInput: string;
  setInterCommodityLeftCategoryInput: (value: string) => void;
  setInterCommodityRightCategoryInput: (value: string) => void;
  setInterCommodityLeftCategoryApplied: (value: string) => void;
  setInterCommodityRightCategoryApplied: (value: string) => void;
  interCommodityLeftContractInput: string;
  interCommodityRightContractInput: string;
  setInterCommodityLeftContractInput: (value: string) => void;
  setInterCommodityRightContractInput: (value: string) => void;
  setInterCommodityLeftContractApplied: (value: string) => void;
  setInterCommodityRightContractApplied: (value: string) => void;
  activeContractKeys: string[];
  categoryOptions: Array<{ value: string; label: string; searchText: string }>;
  monthlyChangeTitle: string;
  monthlyChangeRows: MonthlyChangeRow[];
};

const DashboardHeader = ({
  translate,
  brandLogoText,
  userAvatarText,
  topNav,
  activeTopKey,
  setActiveTopKey,
}: Pick<
  DashboardPageProps,
  | 'translate'
  | 'brandLogoText'
  | 'userAvatarText'
  | 'topNav'
  | 'activeTopKey'
  | 'setActiveTopKey'
>) => (
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

const DashboardMainPanel = (props: DashboardPageProps) => {
  if (props.isMonthlyChangeView) {
    return (
      <MonthlyChangePanel
        title={props.monthlyChangeTitle}
        rows={props.monthlyChangeRows}
        contractOptions={props.activeContractOptions}
        contractValue={props.contractValue}
        onContractChange={props.setContractValue}
      />
    );
  }

  if (!props.isSeasonalChartView && !props.isTermStructureView && !props.isCalendarSpreadView && !props.isInterCommoditySpreadView) {
    return <ComingSoonPanel title={props.activePillName} />;
  }

  const disableFilterSelectors = props.isTermStructureView || props.isCalendarSpreadView || props.isInterCommoditySpreadView;
  return (
    <ChartPanel
      chartData={props.chartData}
      chartSeries={props.displayChartSeries}
      chartAxes={props.displayChartAxes}
      chartTitles={props.displayChartTitles}
      contractOptions={disableFilterSelectors ? [] : props.activeContractOptions}
      contractValue={disableFilterSelectors ? '' : props.contractValue}
      metricOptions={disableFilterSelectors ? [] : props.metricOptions}
      metricValue={props.effectiveMetricType}
      onContractChange={props.setContractValue}
      onMetricChange={(value) => {
        if (!disableFilterSelectors) {
          props.setMetricType(value);
        }
      }}
      controls={<DashboardChartControls {...props} />}
    />
  );
};

const FuturesView = (props: DashboardPageProps) => (
  <>
    <Sider width={props.siderWidth} className="app-sider">
      <div className="side-header">{props.translate('side.header')}</div>
      <SideMenu
        items={props.sideMenuItems}
        openKeys={props.sideOpenKeys}
        onOpenChange={props.setSideOpenKeys}
        selectedKey={props.activeCategoryKey}
        onSelectKey={props.setActiveCategoryKey}
      />
    </Sider>

    <Content className="app-content">
      <PillNav items={props.pillNav} activeKey={props.activePillKey} onClick={props.handlePillClick} />
      <DashboardMainPanel {...props} />
    </Content>
  </>
);

const DashboardPage = (props: DashboardPageProps) => (
  <Layout className="app-layout">
    <DashboardHeader
      translate={props.translate}
      brandLogoText={props.brandLogoText}
      userAvatarText={props.userAvatarText}
      topNav={props.topNav}
      activeTopKey={props.activeTopKey}
      setActiveTopKey={props.setActiveTopKey}
    />

    <Layout className="app-shell">
      {props.isFuturesView ? <FuturesView {...props} /> : <Content className="app-content"><ComingSoonPanel title={props.activeTopName} /></Content>}
    </Layout>
  </Layout>
);

export default DashboardPage;
