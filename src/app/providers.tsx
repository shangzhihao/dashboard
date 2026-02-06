'use client';

import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { siteConfig } from '../config/site';
import { getClientLanguage, normalizeLanguage } from '../i18n';
import '../i18n';

const localeMap = {
  en: enUS,
  zh: zhCN,
};

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const fallbackLocale = localeMap[siteConfig.language.default] || enUS;
  const locale = localeMap[language] || fallbackLocale;

  useEffect(() => {
    const nextLanguage = getClientLanguage();
    if (nextLanguage && nextLanguage !== language) {
      i18n.changeLanguage(nextLanguage);
    }
  }, [i18n, language]);

  return <ConfigProvider locale={locale}>{children}</ConfigProvider>;
}
