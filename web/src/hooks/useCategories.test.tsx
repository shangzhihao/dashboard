import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import i18n from '../i18n';
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
  beforeEach(async () => {
    await i18n.changeLanguage('zh');
  });

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

    expect(result.current.sideOpenKeys).toEqual(['energy']);
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

  it('uses bilingual labels based on active language', async () => {
    mockFetch([
      {
        key: 'energy-chemicals',
        label: '能化品种',
        labelEn: 'Energy & Chemicals',
        children: [{ key: 'SC', label: '原油', labelEn: 'Crude Oil' }],
      },
    ]);

    const { result } = renderHook(() => useCategories('/data/categories.json'));

    await waitFor(() => {
      expect(result.current.activeCategoryKey).toBe('SC');
    });
    expect(result.current.categoryLabelMap).toMatchObject({
      'energy-chemicals': '能化品种',
      SC: '原油',
    });

    await act(async () => {
      await i18n.changeLanguage('en');
    });

    await waitFor(() => {
      expect(result.current.categoryLabelMap).toMatchObject({
        'energy-chemicals': 'Energy & Chemicals',
        SC: 'Crude Oil',
      });
    });
  });

  it('keeps only one category expanded', async () => {
    mockFetch([
      {
        key: 'energy',
        label: 'Energy',
        children: [{ key: 'oil', label: 'Oil' }],
      },
      {
        key: 'metals',
        label: 'Metals',
        children: [{ key: 'cu', label: 'Copper' }],
      },
    ]);

    const { result } = renderHook(() => useCategories('/data/categories.json'));

    await waitFor(() => {
      expect(result.current.sideOpenKeys).toEqual(['energy']);
    });

    act(() => {
      result.current.setSideOpenKeys(['energy', 'metals']);
    });
    expect(result.current.sideOpenKeys).toEqual(['metals']);

    act(() => {
      result.current.setSideOpenKeys([]);
    });
    expect(result.current.sideOpenKeys).toEqual([]);
  });
});
