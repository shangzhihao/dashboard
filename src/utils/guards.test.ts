import { describe, expect, it } from 'vitest';
import { isRecord } from './guards';

describe('isRecord', () => {
  it('returns true for plain objects', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('returns false for arrays and null', () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
  });
});
