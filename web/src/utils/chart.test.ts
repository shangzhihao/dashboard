import { describe, expect, it } from 'vitest';
import { axisTickFormatter, normalizeSeriesConfig } from './chart';

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

describe('axisTickFormatter', () => {
  it('formats values up to 10000 as integers', () => {
    expect(axisTickFormatter(9876.54, 'en')).toBe('9,877');
    expect(axisTickFormatter(10000, 'en')).toBe('10,000');
  });

  it('formats Chinese values above 10000 with 万 and up to 2 decimals', () => {
    expect(axisTickFormatter(12345, 'zh')).toBe('1.23万');
    expect(axisTickFormatter(100000, 'zh')).toBe('10万');
  });

  it('formats English values above 10000 with K and up to 2 decimals', () => {
    expect(axisTickFormatter(12345, 'en')).toBe('12.35K');
    expect(axisTickFormatter(100000, 'en')).toBe('100K');
  });
});
