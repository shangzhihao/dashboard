import { normalizeNavItems, resolvePillAction } from './nav';

describe('normalizeNavItems', () => {
  test('returns empty array for non-array input', () => {
    expect(normalizeNavItems({})).toEqual([]);
    expect(normalizeNavItems(null)).toEqual([]);
  });

  test('normalizes string entries', () => {
    expect(normalizeNavItems(['alpha'])).toEqual([{ key: 'alpha', name: 'alpha' }]);
  });

  test('normalizes object entries and preserves nameKey', () => {
    const items = normalizeNavItems([
      { key: 'home', name: 'Home', nameKey: 'nav.home' },
      { name: 'Fallback Name' },
      { foo: 'bar' },
    ]);

    expect(items[0]).toEqual({
      key: 'home',
      name: 'Home',
      nameKey: 'nav.home',
      func: undefined,
    });

    expect(items[1]).toEqual({
      key: 'Fallback Name',
      name: 'Fallback Name',
      nameKey: undefined,
      func: undefined,
    });

    expect(items).toHaveLength(2);
  });
});

describe('resolvePillAction', () => {
  test('falls back to comingSoon when missing', () => {
    expect(resolvePillAction()).toBe('comingSoon');
  });

  test('returns showSeasonChart for matching func or key', () => {
    expect(resolvePillAction({ key: 'seasonal-analysis', name: 'Seasonal' })).toBe(
      'showSeasonChart',
    );
    expect(resolvePillAction({ key: 'x', name: 'X', func: 'showSeasonChart' })).toBe(
      'showSeasonChart',
    );
  });
});
