import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '../i18n';
import ChartPanel from './ChartPanel';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Legend: ({ content }: { content?: (props: unknown) => React.ReactNode }) => (
    <div>{content ? content({}) : null}</div>
  ),
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Area: () => null,
  Line: () => null,
  Brush: () => null,
}));

const buildSeries = (count: number) =>
  Array.from({ length: count }).map((_, index) => ({
    key: `s${index + 1}`,
    label: `Series ${index + 1}`,
    type: 'line' as const,
    yAxisId: 'left' as const,
    color: `#00000${index}`,
  }));

describe('ChartPanel', () => {
  it('renders the title and filter selects', () => {
    render(
      <ChartPanel
        chartData={[{ date: '2024-01-01', s1: 1 }]}
        chartSeries={[{ key: 's1', label: 'Series 1', type: 'line', yAxisId: 'left' }]}
        chartAxes={{ left: { label: 'Left Axis' } }}
        chartTitles={{ chart: 'Chart Title' }}
        contractOptions={[{ value: 'c01', label: 'Jan' }]}
        contractValue="c01"
        metricOptions={[{ value: 'price', label: 'Price' }]}
        metricValue="price"
        onContractChange={() => undefined}
        onMetricChange={() => undefined}
      />,
    );

    expect(screen.getByText('Chart Title')).toBeTruthy();
    expect(screen.getByText('Jan')).toBeTruthy();
    expect(screen.getByText('Price')).toBeTruthy();
  });

  it('hides series beyond the first five and toggles on click', async () => {
    render(
      <ChartPanel
        chartData={[{ date: '2024-01-01', s1: 1, s6: 6 }]}
        chartSeries={buildSeries(6)}
        chartAxes={{ left: { label: 'Left Axis' } }}
        chartTitles={{ chart: 'Chart Title' }}
        contractOptions={[{ value: 'c01', label: 'Jan' }]}
        contractValue="c01"
        metricOptions={[{ value: 'price', label: 'Price' }]}
        metricValue="price"
        onContractChange={() => undefined}
        onMetricChange={() => undefined}
      />,
    );

    const hiddenButton = await screen.findByText('Series 6');

    await waitFor(() => {
      expect(hiddenButton.style.color).toMatch(/rgb\(194, 198, 214\)|#c2c6d6/);
    });

    fireEvent.click(hiddenButton);

    await waitFor(() => {
      expect(hiddenButton.style.color).toMatch(/rgb\(0, 0, 5\)|#000005/);
    });
  });
});
