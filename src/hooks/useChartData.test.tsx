import { render, screen, waitFor } from '@testing-library/react';
import { useChartData } from './useChartData';

type HarnessProps = {
  url: string;
};

const Harness = ({ url }: HarnessProps) => {
  const { chartData, chartSeries, chartAxes, chartTitles } = useChartData(url);
  return (
    <div data-testid="data">
      {JSON.stringify({ chartData, chartSeries, chartAxes, chartTitles })}
    </div>
  );
};

describe('useChartData', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('loads chart payload pieces', async () => {
    const payload = {
      axes: { left: { label: 'Positions', labelKey: 'chart.axes.left.label' } },
      titles: { panel: 'Panel', panelKey: 'chart.titles.panel' },
      series: [{ key: 'net', label: 'Net', labelKey: 'chart.series.net' }],
      items: [{ date: '2024-01-01', net: 12 }],
    };

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response);

    render(<Harness url="/fake" />);

    await waitFor(() => {
      const text = screen.getByTestId('data').textContent || '{}';
      const parsed = JSON.parse(text) as {
        chartData: Array<{ date: string; net: number }>;
        chartSeries: Array<{ key: string; label: string; labelKey?: string }>;
        chartAxes: { left?: { label?: string; labelKey?: string } };
        chartTitles: { panel?: string; panelKey?: string };
      };

      expect(parsed.chartData).toHaveLength(1);
      expect(parsed.chartSeries[0]).toMatchObject({
        key: 'net',
        label: 'Net',
        labelKey: 'chart.series.net',
      });
      expect(parsed.chartAxes.left).toMatchObject({
        label: 'Positions',
        labelKey: 'chart.axes.left.label',
      });
      expect(parsed.chartTitles.panel).toBe('Panel');
    });
  });
});
