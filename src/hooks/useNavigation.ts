import { useEffect, useState } from 'react';
import type { NavItem } from '../types/nav';
import { isRecord } from '../utils/guards';
import { normalizeNavItems } from '../utils/nav';

export const useNavigation = (navConfigUrl: string) => {
  const [topNav, setTopNav] = useState<NavItem[]>([]);
  const [pillNav, setPillNav] = useState<NavItem[]>([]);
  const [activeTopKey, setActiveTopKey] = useState('');
  const [activePillKey, setActivePillKey] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadNavigation = async () => {
      try {
        const response = await fetch(navConfigUrl, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load navigation: ${response.status}`);
        }
        const payload: unknown = await response.json();
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
        if (isMounted) {
          setTopNav(topItems);
          setPillNav(pillItems);
          setActiveTopKey(nextTop);
          setActivePillKey(nextPill);
        }
      } catch (error) {
        console.warn(error);
        if (isMounted) {
          setTopNav([]);
          setPillNav([]);
          setActiveTopKey('');
          setActivePillKey('');
        }
      }
    };

    loadNavigation();

    return () => {
      isMounted = false;
    };
  }, [navConfigUrl]);

  return {
    topNav,
    pillNav,
    activeTopKey,
    setActiveTopKey,
    activePillKey,
    setActivePillKey,
  };
};
