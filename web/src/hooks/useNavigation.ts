import { useEffect, useState } from 'react';
import type { NavItem } from '../types/nav';
import { isRecord } from '../utils/guards';
import { useJsonResource } from './useJsonResource';
import { normalizeNavItems } from '../utils/nav';

export const useNavigation = (navConfigUrl: string) => {
  const [topNav, setTopNav] = useState<NavItem[]>([]);
  const [pillNav, setPillNav] = useState<NavItem[]>([]);
  const loaded = useJsonResource({
    url: navConfigUrl,
    emptyState: {
      topNav: [] as NavItem[],
      pillNav: [] as NavItem[],
      activeTopKey: '',
      activePillKey: '',
    },
    errorPrefix: 'Failed to load navigation',
    mapPayload: (payload) => {
      const topItems = isRecord(payload) ? normalizeNavItems(payload.topNav) : [];
      const pillItems = isRecord(payload) ? normalizeNavItems(payload.pillNav) : [];
      const nextTop =
        isRecord(payload) && typeof payload.activeTop === 'string'
          ? payload.activeTop
          : topItems[0]?.key || '';
      const nextPill =
        (isRecord(payload) && typeof payload.activePill === 'string'
          ? payload.activePill
          : '') ||
        pillItems[0]?.key ||
        '';
      return {
        topNav: topItems,
        pillNav: pillItems,
        activeTopKey: nextTop,
        activePillKey: nextPill,
      };
    },
  });

  const [activeTopKey, setActiveTopKey] = useState('');
  const [activePillKey, setActivePillKey] = useState('');

  useEffect(() => {
    setTopNav(loaded.topNav);
    setPillNav(loaded.pillNav);
    setActiveTopKey(loaded.activeTopKey);
    setActivePillKey(loaded.activePillKey);
  }, [loaded]);

  return {
    topNav,
    pillNav,
    activeTopKey,
    setActiveTopKey,
    activePillKey,
    setActivePillKey,
  };
};
