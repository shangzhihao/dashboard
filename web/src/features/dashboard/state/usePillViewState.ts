import { useEffect, useState } from 'react';
import type { NavItem, PillFunc } from '../../../types/nav';
import { resolvePillAction } from '../../../utils/nav';

export const usePillViewState = (
  activeTopKey: string,
  pillNav: NavItem[],
  activePillKey: string,
  setActivePillKey: (value: string) => void,
) => {
  const [activePillView, setActivePillView] = useState<PillFunc>('comingSoon');

  useEffect(() => {
    const activeItem = pillNav.find((item) => item.key === activePillKey);
    setActivePillView(resolvePillAction(activeItem));
  }, [activePillKey, pillNav]);

  const handlePillClick = (item: NavItem) => {
    setActivePillKey(item.key);
    setActivePillView(resolvePillAction(item));
  };

  return {
    activePillView,
    handlePillClick,
    isFuturesView: activeTopKey === 'futures' || activeTopKey === '',
    isSeasonalChartView: activePillView === 'showSeasonChart',
    isMonthlyChangeView: activePillView === 'showMonthlyChangeTable',
    isTermStructureView: activePillView === 'showTermStructure',
    isCalendarSpreadView: activePillView === 'showCalendarSpread',
    isInterCommoditySpreadView: activePillView === 'showInterCommoditySpread',
  };
};
