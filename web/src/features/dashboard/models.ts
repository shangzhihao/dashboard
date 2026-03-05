import type { MenuProps } from 'antd';
import type { ChartAxesConfig, ChartDatum, ChartSeriesConfig, ChartTitlesConfig } from '../../types/chart';
import type { MonthlyChangeRow } from '../../types/monthlyChange';
import type { NavItem } from '../../types/nav';

export type Translate = (key: string, options?: Record<string, unknown>) => string;

export type SelectOption = { value: string; label: string };
export type CategoryOption = SelectOption & { searchText: string };

export type DashboardHeaderModel = {
  translate: Translate;
  brandLogoText: string;
  userAvatarText: string;
  topNav: NavItem[];
  activeTopKey: string;
  setActiveTopKey: (value: string) => void;
};

export type DashboardSidebarModel = {
  siderWidth: number;
  sideMenuItems: NonNullable<MenuProps['items']>;
  sideOpenKeys: string[];
  setSideOpenKeys: (keys: string[]) => void;
  activeCategoryKey: string;
  setActiveCategoryKey: (value: string) => void;
};

export type DashboardNavigationModel = {
  pillNav: NavItem[];
  activePillKey: string;
  handlePillClick: (item: NavItem) => void;
  activePillName: string;
  activeTopName: string;
  isFuturesView: boolean;
};

export type DashboardViewFlags = {
  isSeasonalChartView: boolean;
  isMonthlyChangeView: boolean;
  isTermStructureView: boolean;
  isCalendarSpreadView: boolean;
  isInterCommoditySpreadView: boolean;
};

export type DashboardChartModel = {
  chartData: ChartDatum[];
  displayChartSeries: ChartSeriesConfig[];
  displayChartAxes: ChartAxesConfig;
  displayChartTitles: ChartTitlesConfig;
  activeContractOptions: SelectOption[];
  contractValue: string;
  metricOptions: SelectOption[];
  effectiveMetricType: string;
  setContractValue: (value: string) => void;
  setMetricType: (value: string) => void;
};

export type DashboardControlsModel = DashboardViewFlags & {
  translate: Translate;
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
  activeContractOptions: SelectOption[];
  categoryOptions: CategoryOption[];
  setActiveCategoryKey: (value: string) => void;
};

export type DashboardMonthlyModel = {
  monthlyChangeTitle: string;
  monthlyChangeRows: MonthlyChangeRow[];
  contractOptions: SelectOption[];
  contractValue: string;
  setContractValue: (value: string) => void;
};

export type DashboardPageModel = {
  header: DashboardHeaderModel;
  sidebar: DashboardSidebarModel;
  navigation: DashboardNavigationModel;
  views: DashboardViewFlags;
  chart: DashboardChartModel;
  controls: DashboardControlsModel;
  monthly: DashboardMonthlyModel;
};
