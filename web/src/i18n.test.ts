import { afterEach, describe, expect, it, vi } from 'vitest';
import { getClientLanguage, normalizeLanguage } from './i18n';
import { siteConfig } from './config/site';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('i18n helpers', () => {
  it('normalizes supported languages and falls back', () => {
    expect(normalizeLanguage('en-US')).toBe('en');
    expect(normalizeLanguage('zh-CN')).toBe('zh');
    expect(normalizeLanguage('fr')).toBe(siteConfig.language.default);
  });

  it('reads language from localStorage when available', () => {
    const store = new Map<string, string>();
    const originalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
      },
      configurable: true,
    });

    window.localStorage.setItem(siteConfig.language.storageKey, 'en');
    expect(getClientLanguage()).toBe('en');
    window.localStorage.removeItem(siteConfig.language.storageKey);

    Object.defineProperty(window, 'localStorage', {
      value: originalStorage,
      configurable: true,
    });
  });

  it('prefers zh when browser language is zh and no stored value exists', () => {
    window.localStorage.removeItem(siteConfig.language.storageKey);
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('zh-CN');

    expect(getClientLanguage()).toBe('zh');
  });

  it('falls back to en when browser language is not zh and no stored value exists', () => {
    window.localStorage.removeItem(siteConfig.language.storageKey);
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('fr-FR');

    expect(getClientLanguage()).toBe('en');
  });
});
