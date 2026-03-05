import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import i18n from './i18n';
import './i18n';
import App from './App';

vi.mock('./components/ChartPanel', () => ({
  default: ({
    chartTitles,
    chartSeries,
  }: {
    chartTitles: { chart?: string };
    chartSeries?: Array<{ key?: string; label?: string }>;
  }) => (
    <div>
      <div>{chartTitles.chart}</div>
      <div data-testid="chart-series">{(chartSeries ?? []).map((series) => series.label || series.key || '').join('|')}</div>
    </div>
  ),
}));

vi.mock('./components/MonthlyChangePanel', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

const mockFetch = (handlers: Array<[string, unknown]>) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async (input: RequestInfo) => {
      const url = String(input);
      const match = handlers.find(([key]) => url.endsWith(key));
      if (!match) {
        return { ok: false, json: async () => ({}) } as Response;
      }
      return { ok: true, json: async () => match[1] } as Response;
    }),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('App navigation and term structure views', () => {
  it('renders Coming Soon panel when non-futures top nav is active', async () => {
    await i18n.changeLanguage('en');
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentContract = `c${currentMonth}`;
    mockFetch([
      [
        '/data/categories.json',
        [{ key: 'energy', label: 'Energy', children: [{ key: 'oil', label: 'Oil' }] }],
      ],
      [
        '/data/filters.json',
        {
          metrics: [{ key: 'price', label: 'Price', contractKeys: [currentContract] }],
          contracts: [{ key: currentContract, label: 'Current' }],
          defaultMetric: 'price',
        },
      ],
      [
        '/data/navigation.json',
        {
          topNav: [{ key: 'spot', nameKey: 'nav.spot' }],
          pillNav: [{ key: 'alpha', name: 'Alpha' }],
          activeTop: 'spot',
          activePill: 'alpha',
        },
      ],
    ]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Spot' })).toBeTruthy();
    });
    expect(screen.getByText('Coming soon')).toBeTruthy();
    const languageToggle = screen.getByRole('button', { name: '中' });
    fireEvent.click(languageToggle);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'EN' })).toBeTruthy();
    });
  });

  it('renders term structure view when pill is active', async () => {
    await i18n.changeLanguage('en');
    const queryDate = dayjs().format('YYYY-MM-DD');
    const queryDatePath = queryDate.replace(/-/g, '/');
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentContract = `c${currentMonth}`;
    mockFetch([
      [
        '/data/categories.json',
        [
          {
            key: 'energy',
            label: 'Energy',
            children: [{ key: 'oil', label: 'Oil' }],
          },
        ],
      ],
      [
        '/data/filters.json',
        {
          metrics: [{ key: 'price', label: 'Price', contractKeys: [currentContract] }],
          contracts: [{ key: currentContract, label: 'Current' }],
          defaultMetric: 'price',
        },
      ],
      [
        '/data/navigation.json',
        {
          topNav: [{ key: 'futures', nameKey: 'nav.futures' }],
          pillNav: [
            {
              key: 'term-structure',
              nameKey: 'pill.termStructure',
              func: 'showTermStructure',
            },
          ],
          activeTop: 'futures',
          activePill: 'term-structure',
        },
      ],
      [
        `/data/futures/term-structure/oil/${queryDatePath}.json`,
        {
          items: [{ date: 'near', t0: 10 }],
          series: [{ key: 't0', label: 'Today', type: 'line', yAxisId: 'left' }],
          axes: { left: { label: 'Price' } },
          titles: { chart: 'Term Structure' },
        },
      ],
    ]);

    render(<App />);

    expect(await screen.findByText('Oil Term Structure')).toBeTruthy();
    expect(screen.queryByText('Coming soon')).toBeNull();
  });
});
