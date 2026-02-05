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
    chartData: `${publicUrl}/data/chart-data.json`,
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
