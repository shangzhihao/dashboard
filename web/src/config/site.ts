const publicUrl = process.env.NEXT_PUBLIC_BASE_PATH || process.env.PUBLIC_URL || '';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export const siteConfig = {
  language: {
    default: 'en',
    fallback: 'en',
    storageKey: 'dashboard.language',
    supported: ['zh', 'en'],
  },
  dataUrls: {
    categories: `${publicUrl}/data/categories.json`,
    navigation: `${publicUrl}/data/navigation.json`,
    filters: `${publicUrl}/data/filters.json`,
    chartDataPositions: `${apiBaseUrl}/data/futures/positions`,
    chartDataPrice: `${apiBaseUrl}/data/futures/price`,
  },
  layout: {
    siderWidth: 220,
  },
  brand: {
    logoText: 'JN',
  },
  user: {
    avatarText: 'JS',
  },
} as const;

export type SupportedLanguage = (typeof siteConfig.language.supported)[number];
