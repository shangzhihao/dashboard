import type { NavItem } from '../../../types/nav';

export type SelectOption = { value: string; label: string };
export type CategoryOption = SelectOption & { searchText: string };

export type DataUrls = {
  chartDataPositions: string;
  chartDataPrice: string;
  termStructure: string;
  monthlyChangeStats: string;
  calendarSpread: string;
  interCommoditySpread: string;
};

export type UseDashboardStateParams = {
  dataUrls: DataUrls;
  activeTopKey: string;
  activeCategoryKey: string;
  setActiveCategoryKey: (value: string) => void;
  pillNav: NavItem[];
  activePillKey: string;
  setActivePillKey: (value: string) => void;
  metricOptions: SelectOption[];
  defaultMetricKey: string;
  metricContractMap: Record<string, string[]>;
  contractOptions: SelectOption[];
  categoryOptions: CategoryOption[];
};
