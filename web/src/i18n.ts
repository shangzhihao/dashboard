import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { siteConfig, type SupportedLanguage } from './config/site';
import en from './locales/en';
import zh from './locales/zh';

export const normalizeLanguage = (language?: string): SupportedLanguage => {
  if (!language) {
    return siteConfig.language.default;
  }

  const lower = language.toLowerCase();
  const match = siteConfig.language.supported.find(
    (code) => lower === code || lower.startsWith(`${code}-`),
  );
  return match ?? siteConfig.language.default;
};

export const getNumberLocale = (language?: string) =>
  normalizeLanguage(language) === 'zh' ? 'zh-CN' : 'en-US';

export const getClientLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') {
    return siteConfig.language.default;
  }

  const stored = window.localStorage.getItem(siteConfig.language.storageKey);
  if (stored) {
    return normalizeLanguage(stored);
  }

  const browserLanguage = window.navigator?.language;
  return normalizeLanguage(browserLanguage);
};

i18n.use(initReactI18next).init({
  resources: { en, zh },
  lng: siteConfig.language.default,
  fallbackLng: siteConfig.language.fallback,
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (language) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(siteConfig.language.storageKey, normalizeLanguage(language));
});

export default i18n;
