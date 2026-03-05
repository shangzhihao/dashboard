import type { NavItem, PillFunc } from '../types/nav';
import { isRecord } from './guards';

export const normalizeNavItems = (value: unknown): NavItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (typeof entry === 'string') {
      return [{ key: entry, name: entry }];
    }

    if (isRecord(entry)) {
      const key =
        typeof entry.key === 'string'
          ? entry.key
          : typeof entry.name === 'string'
            ? entry.name
            : '';

      if (!key) {
        return [];
      }

      const name = typeof entry.name === 'string' ? entry.name : key;
      const nameKey = typeof entry.nameKey === 'string' ? entry.nameKey : undefined;
      const func = typeof entry.func === 'string' ? entry.func : undefined;
      return [{ key, name, nameKey, func }];
    }

    return [];
  });
};

export const resolvePillAction = (item?: NavItem): PillFunc => {
  if (!item) {
    return 'comingSoon';
  }

  if (item.func === 'showSeasonChart' || item.key === 'seasonal-analysis') {
    return 'showSeasonChart';
  }

  if (item.func === 'showMonthlyChangeTable' || item.key === 'monthly-change-stats') {
    return 'showMonthlyChangeTable';
  }

  if (item.func === 'showTermStructure' || item.key === 'term-structure') {
    return 'showTermStructure';
  }

  if (item.func === 'showCalendarSpread' || item.key === 'calendar-arbitrage') {
    return 'showCalendarSpread';
  }

  if (item.func === 'comingSoon') {
    return 'comingSoon';
  }

  return 'comingSoon';
};
