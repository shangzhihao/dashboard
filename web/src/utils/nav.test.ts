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

  test('returns showMonthlyChangeTable for matching func or key', () => {
    expect(resolvePillAction({ key: 'monthly-change-stats', name: 'Stats' })).toBe(
      'showMonthlyChangeTable',
    );
    expect(resolvePillAction({ key: 'x', name: 'X', func: 'showMonthlyChangeTable' })).toBe(
      'showMonthlyChangeTable',
    );
  });

  test('returns showTermStructure for matching func or key', () => {
    expect(resolvePillAction({ key: 'term-structure', name: 'Term Structure' })).toBe(
      'showTermStructure',
    );
    expect(resolvePillAction({ key: 'x', name: 'X', func: 'showTermStructure' })).toBe(
      'showTermStructure',
    );
  });

  test('returns showCalendarSpread for matching func or key', () => {
    expect(resolvePillAction({ key: 'calendar-arbitrage', name: 'Calendar Arbitrage' })).toBe(
      'showCalendarSpread',
    );
    expect(resolvePillAction({ key: 'x', name: 'X', func: 'showCalendarSpread' })).toBe(
      'showCalendarSpread',
    );
  });

  test('returns showInterCommoditySpread for matching func or key', () => {
    expect(
      resolvePillAction({ key: 'inter-commodity-arbitrage', name: 'Inter Commodity Arbitrage' }),
    ).toBe('showInterCommoditySpread');
    expect(resolvePillAction({ key: 'x', name: 'X', func: 'showInterCommoditySpread' })).toBe(
      'showInterCommoditySpread',
    );
  });
});
