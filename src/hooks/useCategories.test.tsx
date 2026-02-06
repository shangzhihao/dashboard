import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '../i18n';
import { useCategories } from './useCategories';

const mockFetch = (payload: unknown, ok = true) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: async () => payload,
    } as Response),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useCategories', () => {
  it('normalizes categories and selects the first leaf', async () => {
    mockFetch([
      {
        key: 'energy',
        label: 'Energy',
        children: [{ key: 'oil', label: 'Oil' }],
      },
      { key: 'metals', label: 'Metals' },
    ]);

    const { result } = renderHook(() => useCategories('/data/categories.json'));

    await waitFor(() => {
      expect(result.current.activeCategoryKey).toBe('oil');
    });

    expect(result.current.sideOpenKeys).toEqual(['energy', 'metals']);
    const menuItems = result.current.sideMenuItems as Array<any>;
    expect(menuItems[0].key).toBe('energy');
    expect(menuItems[0].children[0].key).toBe('oil');
    expect(result.current.categoryLabelMap).toMatchObject({
      energy: 'Energy',
      oil: 'Oil',
      metals: 'Metals',
    });
  });

  it('falls back to empty state on fetch error', async () => {
    mockFetch({ message: 'fail' }, false);

    const { result } = renderHook(() => useCategories('/data/categories.json'));

    await waitFor(() => {
      expect(result.current.sideMenuItems).toEqual([]);
    });

    expect(result.current.sideOpenKeys).toEqual([]);
    expect(result.current.activeCategoryKey).toBe('');
  });
});
