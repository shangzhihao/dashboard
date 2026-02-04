import { normalizeSeriesConfig } from './chart';

describe('normalizeSeriesConfig', () => {
  test('uses provided series and appends extra data keys', () => {
    const series = [
      {
        key: 'net',
        label: 'Net',
        labelKey: 'chart.series.net',
        type: 'area' as const,
        yAxisId: 'left' as const,
        color: '#111111',
      },
    ];
    const data = [{ date: '2024-01-01', net: 1, extra: 2 }];

    const normalized = normalizeSeriesConfig(series, data);

    expect(normalized).toHaveLength(2);
    expect(normalized[0]).toMatchObject({
      key: 'net',
      label: 'Net',
      labelKey: 'chart.series.net',
      type: 'area',
      yAxisId: 'left',
      color: '#111111',
    });
    expect(normalized[1]).toMatchObject({
      key: 'extra',
      label: 'extra',
      type: 'line',
      yAxisId: 'left',
    });
  });

  test('falls back to series when no config or data keys', () => {
    const normalized = normalizeSeriesConfig([], []);

    expect(normalized.length).toBeGreaterThan(0);
    expect(normalized[0].labelKey).toBeDefined();
  });
});
