import { useEffect, useMemo, useState } from 'react';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { isRecord } from '../utils/guards';

type CategoryItem = {
  key: string;
  label?: string;
  labelKey?: string;
  children?: CategoryItem[];
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
    const labelKey = typeof entry.labelKey === 'string' ? entry.labelKey : undefined;
    const children = normalizeCategoryItems(entry.children);

    return [
      {
        key,
        label,
        labelKey,
        children: children.length > 0 ? children : undefined,
      },
    ];
  });
};

const buildMenuItems = (
  items: CategoryItem[],
  translate: (key: string) => string,
): MenuItem[] =>
  items.map((item) => {
    const label = item.labelKey ? translate(item.labelKey) : item.label ?? item.key;
    if (item.children && item.children.length > 0) {
      return {
        key: item.key,
        label,
        children: buildMenuItems(item.children, translate),
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
  map: Record<string, string> = {},
): Record<string, string> => {
  items.forEach((item) => {
    const label = item.labelKey ? translate(item.labelKey) : item.label ?? item.key;
    map[item.key] = label;
    if (item.children && item.children.length > 0) {
      buildLabelMap(item.children, translate, map);
    }
  });

  return map;
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
  const { t } = useTranslation();
  const [rawItems, setRawItems] = useState<CategoryItem[]>([]);
  const [sideOpenKeys, setSideOpenKeys] = useState<string[]>([]);
  const [activeCategoryKey, setActiveCategoryKey] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await fetch(categoriesUrl, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load categories: ${response.status}`);
        }
        const payload: unknown = await response.json();
        const items = Array.isArray(payload)
          ? payload
          : payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)
            ? (payload as { items: unknown[] }).items
            : [];
        if (isMounted) {
          const nextItems = normalizeCategoryItems(items);
          const nextOpenKeys = nextItems.map((item) => item.key);
          setRawItems(nextItems);
          setSideOpenKeys(nextOpenKeys);
          setActiveCategoryKey((prev) => prev || findFirstLeafKey(nextItems));
        }
      } catch (error) {
        console.warn(error);
        if (isMounted) {
          setRawItems([]);
          setSideOpenKeys([]);
          setActiveCategoryKey('');
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [categoriesUrl]);

  const sideMenuItems: NonNullable<MenuProps['items']> = useMemo(
    () => buildMenuItems(rawItems, t),
    [rawItems, t],
  );

  const categoryLabelMap = useMemo(() => buildLabelMap(rawItems, t), [rawItems, t]);

  return {
    sideMenuItems,
    sideOpenKeys,
    setSideOpenKeys,
    activeCategoryKey,
    setActiveCategoryKey,
    categoryLabelMap,
  };
};
