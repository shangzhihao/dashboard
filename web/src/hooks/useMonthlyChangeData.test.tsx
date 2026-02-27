import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMonthlyChangeData } from './useMonthlyChangeData';

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

describe('useMonthlyChangeData', () => {
  it('hydrates monthly change rows from payload', async () => {
    mockFetch({
      items: [{ year: '24', m01: 1.2, m02: -0.5, m03: null }],
    });

    const { result } = renderHook(() => useMonthlyChangeData('/data/monthly-change.json'));

    await waitFor(() => {
      expect(result.current.rows.length).toBe(1);
    });

    expect(result.current.rows[0].year).toBe('24');
    expect(result.current.rows[0].m01).toBe(1.2);
    expect(result.current.rows[0].m02).toBe(-0.5);
    expect(result.current.rows[0].m03).toBeNull();
  });

  it('returns empty state when url is missing', async () => {
    const { result } = renderHook(() => useMonthlyChangeData(''));
    await waitFor(() => {
      expect(result.current.rows).toEqual([]);
    });
  });
});
