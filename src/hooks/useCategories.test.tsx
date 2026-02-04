import { render, screen, waitFor } from '@testing-library/react';
import i18n from '../i18n';
import { useCategories } from './useCategories';

type HarnessProps = {
  url: string;
};

const Harness = ({ url }: HarnessProps) => {
  const { sideMenuItems, sideOpenKeys } = useCategories(url);
  return (
    <div data-testid="data">
      {JSON.stringify({ sideMenuItems, sideOpenKeys })}
    </div>
  );
};

describe('useCategories', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('loads categories and translates labels', async () => {
    await i18n.changeLanguage('en');

    const payload = [
      {
        key: 'black',
        label: '黑色系',
        labelKey: 'category.black.title',
        children: [
          {
            key: 'black-iron',
            label: '铁矿',
            labelKey: 'category.black.iron',
          },
        ],
      },
    ];

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response);

    render(<Harness url="/fake" />);

    await waitFor(() => {
      const text = screen.getByTestId('data').textContent || '{}';
      const parsed = JSON.parse(text) as {
        sideMenuItems: Array<{ label: string; children?: Array<{ label: string }> }>;
        sideOpenKeys: string[];
      };

      expect(parsed.sideMenuItems.length).toBe(1);
      expect(parsed.sideMenuItems[0].label).toBe('Ferrous');
      expect(parsed.sideMenuItems[0].children?.[0].label).toBe('Iron Ore');
      expect(parsed.sideOpenKeys).toEqual(['black']);
    });
  });
});
