import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '../i18n';
import { useFilters } from './useFilters';

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

describe('useFilters', () => {
  it('uses payload defaults and builds maps', async () => {
    mockFetch({
      metrics: [
        { key: 'price', label: 'Price', contractKeys: ['c01', 'c02'] },
        { key: 'positions', label: 'Positions' },
      ],
      contracts: [
        { key: 'c01', label: 'Jan' },
        { key: 'c02', label: 'Feb' },
      ],
      defaultMetric: 'positions',
    });

    const { result } = renderHook(() => useFilters('/data/filters.json'));

    await waitFor(() => {
      expect(result.current.metricOptions.length).toBe(2);
    });

    expect(result.current.defaultMetricKey).toBe('positions');
    expect(result.current.contractOptions.map((option) => option.value)).toEqual([
      'c01',
      'c02',
    ]);
    expect(result.current.metricContractMap.price).toEqual(['c01', 'c02']);
    expect(result.current.metricContractMap.positions).toEqual([]);
    expect(result.current.contractLabelMap).toMatchObject({
      c01: 'Jan',
      c02: 'Feb',
    });
  });

  it('falls back to first metric when default is missing', async () => {
    mockFetch({
      metrics: [{ key: 'price', label: 'Price' }],
      contracts: [],
    });

    const { result } = renderHook(() => useFilters('/data/filters.json'));

    await waitFor(() => {
      expect(result.current.defaultMetricKey).toBe('price');
    });
  });
});
