import { render, screen, waitFor } from '@testing-library/react';
import { useNavigation } from './useNavigation';

type HarnessProps = {
  url: string;
};

const Harness = ({ url }: HarnessProps) => {
  const { topNav, pillNav, activeTopKey, activePillKey } = useNavigation(url);
  return (
    <div data-testid="data">
      {JSON.stringify({ topNav, pillNav, activeTopKey, activePillKey })}
    </div>
  );
};

describe('useNavigation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('loads navigation and applies active keys', async () => {
    const payload = {
      topNav: [{ key: 'home', name: 'Home', nameKey: 'nav.home' }],
      pillNav: [
        {
          key: 'seasonal-analysis',
          name: 'Seasonal Analysis',
          nameKey: 'pill.seasonalAnalysis',
          func: 'showSeasonChart',
        },
      ],
      activeTop: 'home',
      activePill: 'seasonal-analysis',
    };

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response);

    render(<Harness url="/fake" />);

    await waitFor(() => {
      const text = screen.getByTestId('data').textContent || '{}';
      const parsed = JSON.parse(text) as {
        topNav: Array<{ key: string; name: string; nameKey?: string }>;
        pillNav: Array<{ key: string; name: string; nameKey?: string; func?: string }>;
        activeTopKey: string;
        activePillKey: string;
      };

      expect(parsed.topNav[0]).toMatchObject({ key: 'home', name: 'Home', nameKey: 'nav.home' });
      expect(parsed.pillNav[0]).toMatchObject({
        key: 'seasonal-analysis',
        name: 'Seasonal Analysis',
        nameKey: 'pill.seasonalAnalysis',
        func: 'showSeasonChart',
      });
      expect(parsed.activeTopKey).toBe('home');
      expect(parsed.activePillKey).toBe('seasonal-analysis');
    });
  });
});
