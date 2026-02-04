import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import zh from './locales/zh';

export const LANGUAGE_STORAGE_KEY = 'dashboard.language';

export const normalizeLanguage = (language?: string) =>
  language && language.toLowerCase().startsWith('zh') ? 'zh' : 'en';

export const getNumberLocale = (language?: string) =>
  normalizeLanguage(language) === 'zh' ? 'zh-CN' : 'en-US';

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'zh';
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored) {
    return normalizeLanguage(stored);
  }

  const browserLanguage = window.navigator?.language;
  return normalizeLanguage(browserLanguage);
};

i18n.use(initReactI18next).init({
  resources: { en, zh },
  lng: getInitialLanguage(),
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (language) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(language));
});

export default i18n;
