import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useChartData } from './useChartData';

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

describe('useChartData', () => {
  it('hydrates chart config from payload', async () => {
    mockFetch({
      items: [{ date: '2024-01-01', net: 1 }],
      series: [{ key: 'net', label: 'Net', type: 'area', yAxisId: 'left' }],
      axes: { left: { label: 'Positions' } },
      titles: { chart: 'Net Positions' },
    });

    const { result } = renderHook(() => useChartData('/data/mock.json'));

    await waitFor(() => {
      expect(result.current.chartData.length).toBe(1);
    });

    expect(result.current.chartSeries[0].key).toBe('net');
    expect(result.current.chartAxes.left?.label).toBe('Positions');
    expect(result.current.chartTitles.chart).toBe('Net Positions');
  });

  it('returns empty state when url is missing', async () => {
    const { result } = renderHook(() => useChartData(''));

    await waitFor(() => {
      expect(result.current.chartData).toEqual([]);
    });

    expect(result.current.chartSeries).toEqual([]);
    expect(result.current.chartAxes).toEqual({});
    expect(result.current.chartTitles).toEqual({});
  });
});
