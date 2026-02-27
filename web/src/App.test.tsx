import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18n from './i18n';
import './i18n';
import App from './App';

vi.mock('./components/ChartPanel', () => ({
  default: ({ chartTitles }: { chartTitles: { chart?: string } }) => (
    <div>{chartTitles.chart}</div>
  ),
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

describe('App', () => {
  it('renders the seasonal chart view when futures + seasonal analysis are active', async () => {
    await i18n.changeLanguage('en');
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
          metrics: [
            { key: 'price', label: 'Price', contractKeys: [currentContract] },
          ],
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
              key: 'seasonal-analysis',
              nameKey: 'pill.seasonalAnalysis',
              func: 'showSeasonChart',
            },
          ],
          activeTop: 'futures',
          activePill: 'seasonal-analysis',
        },
      ],
      [
        `/data/futures/price/oil/${currentMonth}.json`,
        {
          items: [{ date: '2024-02-01', price: 10 }],
          series: [{ key: 'price', label: 'Price', type: 'line', yAxisId: 'left' }],
          axes: { left: { label: 'Price' } },
          titles: { chart: 'Price Chart' },
        },
      ],
    ]);

    render(<App />);

    expect(await screen.findByText('Oil Current Price')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Search')).toBeNull();
  });

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
});
