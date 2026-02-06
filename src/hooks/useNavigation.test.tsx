import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNavigation } from './useNavigation';

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

describe('useNavigation', () => {
  it('loads nav items and uses configured active keys', async () => {
    mockFetch({
      topNav: [{ key: 'futures', name: 'Futures' }],
      pillNav: [{ key: 'seasonal-analysis', name: 'Seasonal', func: 'showSeasonChart' }],
      activeTop: 'futures',
      activePill: 'seasonal-analysis',
    });

    const { result } = renderHook(() => useNavigation('/data/navigation.json'));

    await waitFor(() => {
      expect(result.current.topNav.length).toBe(1);
    });

    expect(result.current.activeTopKey).toBe('futures');
    expect(result.current.activePillKey).toBe('seasonal-analysis');
  });

  it('falls back to first item when active keys are missing', async () => {
    mockFetch({
      topNav: [{ key: 'home', name: 'Home' }],
      pillNav: [{ key: 'alpha', name: 'Alpha' }],
    });

    const { result } = renderHook(() => useNavigation('/data/navigation.json'));

    await waitFor(() => {
      expect(result.current.activeTopKey).toBe('home');
    });

    expect(result.current.activePillKey).toBe('alpha');
  });
});
