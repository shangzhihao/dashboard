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
      const func = typeof entry.func === 'string' ? entry.func : undefined;
      return [{ key, name, func }];
    }
    return [];
  });
};

export const resolvePillAction = (item?: NavItem): PillFunc => {
  if (!item) {
    return 'comingSoon';
  }
  if (item.func === 'showSeasonChart') {
    return 'showSeasonChart';
  }
  if (item.func === 'comingSoon') {
    return 'comingSoon';
  }
  if (item.key === 'seasonal-analysis' || item.name === '季节性分析') {
    return 'showSeasonChart';
  }
  return 'comingSoon';
};
