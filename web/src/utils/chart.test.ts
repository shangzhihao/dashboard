import { describe, expect, it } from 'vitest';
import { normalizeSeriesConfig } from './chart';

const makeData = (value: Record<string, number | string>) => [
  {
    date: '2024-01-01',
    ...value,
  },
];

describe('normalizeSeriesConfig', () => {
  it('derives series from data keys when config is empty', () => {
    const series = normalizeSeriesConfig([], makeData({ open: 1, close: 2 }));
    expect(series.map((item) => item.key)).toEqual(['open', 'close']);
  });

  it('uses fallback series when data is missing', () => {
    const series = normalizeSeriesConfig([], []);
    expect(series.map((item) => item.key)).toEqual(['net', 'long', 'short']);
  });

  it('appends extra data keys not in the config', () => {
    const series = normalizeSeriesConfig(
      [{ key: 'net', type: 'line', yAxisId: 'left' }],
      makeData({ net: 1, extra: 2 }),
    );
    expect(series.map((item) => item.key)).toEqual(['net', 'extra']);
  });
});
