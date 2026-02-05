const publicUrl = process.env.PUBLIC_URL || '';

export const siteConfig = {
  language: {
    default: 'zh',
    fallback: 'zh',
    storageKey: 'dashboard.language',
    supported: ['zh', 'en'],
  },
  dataUrls: {
    categories: `${publicUrl}/data/categories.json`,
    navigation: `${publicUrl}/data/navigation.json`,
    filters: `${publicUrl}/data/filters.json`,
    chartDataPositions: `${publicUrl}/data/mock/positions`,
    chartDataPrice: `${publicUrl}/data/mock/price`,
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
