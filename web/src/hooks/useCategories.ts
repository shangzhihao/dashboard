import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { normalizeLanguage } from '../i18n';
import { isRecord } from '../utils/guards';
import { useJsonResource } from './useJsonResource';

type CategoryItem = {
  key: string;
  label?: string;
  labelEn?: string;
  labelKey?: string;
  children?: CategoryItem[];
};

type CategoryOption = {
  value: string;
  label: string;
  searchText: string;
};

type MenuItem = NonNullable<MenuProps['items']>[number];

const normalizeCategoryItems = (value: unknown): CategoryItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const rawKey = entry.key;
    if (typeof rawKey !== 'string' && typeof rawKey !== 'number') {
      return [];
    }
    const key = String(rawKey);

    const label = typeof entry.label === 'string' ? entry.label : undefined;
    const labelEn = typeof entry.labelEn === 'string' ? entry.labelEn : undefined;
    const labelKey = typeof entry.labelKey === 'string' ? entry.labelKey : undefined;
    const children = normalizeCategoryItems(entry.children);

    return [
      {
        key,
        label,
        labelEn,
        labelKey,
        children: children.length > 0 ? children : undefined,
      },
    ];
  });
};

const resolveLabel = (
  item: CategoryItem,
  translate: (key: string) => string,
  language: 'zh' | 'en',
): string => {
  if (item.labelKey) {
    return translate(item.labelKey);
  }
  if (language === 'en') {
    return item.labelEn ?? item.label ?? item.key;
  }
  return item.label ?? item.labelEn ?? item.key;
};

const buildMenuItems = (
  items: CategoryItem[],
  translate: (key: string) => string,
  language: 'zh' | 'en',
): MenuItem[] =>
  items.map((item) => {
    const label = resolveLabel(item, translate, language);
    if (item.children && item.children.length > 0) {
      return {
        key: item.key,
        label,
        children: buildMenuItems(item.children, translate, language),
      };
    }

    return {
      key: item.key,
      label,
    };
  });

const buildLabelMap = (
  items: CategoryItem[],
  translate: (key: string) => string,
  language: 'zh' | 'en',
  map: Record<string, string> = {},
): Record<string, string> => {
  items.forEach((item) => {
    const label = resolveLabel(item, translate, language);
    map[item.key] = label;
    if (item.children && item.children.length > 0) {
      buildLabelMap(item.children, translate, language, map);
    }
  });

  return map;
};

const collectLeafOptions = (
  items: CategoryItem[],
  translate: (key: string) => string,
  language: 'zh' | 'en',
  options: CategoryOption[] = [],
): CategoryOption[] => {
  items.forEach((item) => {
    if (item.children && item.children.length > 0) {
      collectLeafOptions(item.children, translate, language, options);
      return;
    }

    const resolvedLabel = resolveLabel(item, translate, language);
    const displayLabel = language === 'zh' ? `${resolvedLabel}/${item.key}` : `${resolvedLabel} / ${item.key}`;
    options.push({
      value: item.key,
      label: displayLabel,
      searchText: `${item.key} ${resolvedLabel} ${displayLabel}`.toLowerCase(),
    });
  });
  return options;
};

const findFirstLeafKey = (items: CategoryItem[]): string => {
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      const childKey = findFirstLeafKey(item.children);
      if (childKey) {
        return childKey;
      }
    } else {
      return item.key;
    }
  }

  return '';
};

export const useCategories = (categoriesUrl: string) => {
  const { t, i18n } = useTranslation();
  const [rawItems, setRawItems] = useState<CategoryItem[]>([]);
  const [sideOpenKeys, setSideOpenKeysState] = useState<string[]>([]);
  const [activeCategoryKey, setActiveCategoryKey] = useState('');
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const rootKeys = useMemo(() => rawItems.map((item) => item.key), [rawItems]);

  const loaded = useJsonResource({
    url: categoriesUrl,
    emptyState: {
      rawItems: [] as CategoryItem[],
      firstOpenKey: '',
      firstLeafKey: '',
    },
    errorPrefix: 'Failed to load categories',
    mapPayload: (payload) => {
      const items = Array.isArray(payload)
        ? payload
        : payload &&
            typeof payload === 'object' &&
            Array.isArray((payload as { items?: unknown }).items)
          ? (payload as { items: unknown[] }).items
          : [];
      const nextItems = normalizeCategoryItems(items);
      return {
        rawItems: nextItems,
        firstOpenKey: nextItems[0]?.key || '',
        firstLeafKey: findFirstLeafKey(nextItems),
      };
    },
  });

  useEffect(() => {
    setRawItems(loaded.rawItems);
    setSideOpenKeysState(loaded.firstOpenKey ? [loaded.firstOpenKey] : []);
    setActiveCategoryKey((prev) => prev || loaded.firstLeafKey);
  }, [loaded]);

  const sideMenuItems: NonNullable<MenuProps['items']> = useMemo(
    () => buildMenuItems(rawItems, t, language),
    [language, rawItems, t],
  );

  const categoryLabelMap = useMemo(
    () => buildLabelMap(rawItems, t, language),
    [language, rawItems, t],
  );
  const categoryOptions = useMemo(
    () => collectLeafOptions(rawItems, t, language),
    [language, rawItems, t],
  );

  const setSideOpenKeys = useCallback(
    (keys: string[]) => {
      const validKeys = keys.filter((key) => rootKeys.includes(key));
      const latestOpened = validKeys.find((key) => !sideOpenKeys.includes(key));
      if (latestOpened) {
        setSideOpenKeysState([latestOpened]);
        return;
      }
      if (validKeys.length === 0) {
        setSideOpenKeysState([]);
        return;
      }
      setSideOpenKeysState([validKeys[0]]);
    },
    [rootKeys, sideOpenKeys],
  );

  return {
    sideMenuItems,
    sideOpenKeys,
    setSideOpenKeys,
    activeCategoryKey,
    setActiveCategoryKey,
    categoryLabelMap,
    categoryOptions,
  };
};
