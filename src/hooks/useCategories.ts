import { useEffect, useState } from 'react';
import type { MenuProps } from 'antd';

type MenuItem = NonNullable<MenuProps['items']>[number];

export const useCategories = (categoriesUrl: string) => {
  const [sideMenuItems, setSideMenuItems] = useState<NonNullable<MenuProps['items']>>([]);
  const [sideOpenKeys, setSideOpenKeys] = useState<string[]>([]);

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
          const nextItems = Array.isArray(items) ? items : [];
          const nextOpenKeys = nextItems
            .map((item) => (item as MenuItem)?.key)
            .filter((key): key is string | number => key !== undefined && key !== null)
            .map((key) => String(key));
          setSideMenuItems(nextItems as NonNullable<MenuProps['items']>);
          setSideOpenKeys(nextOpenKeys);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
        if (isMounted) {
          setSideMenuItems([]);
          setSideOpenKeys([]);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [categoriesUrl]);

  return { sideMenuItems, sideOpenKeys, setSideOpenKeys };
};
