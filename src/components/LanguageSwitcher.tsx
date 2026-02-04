import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import i18n, { normalizeLanguage } from '../i18n';

const languageOptions = [
  { value: 'zh', labelKey: 'language.zh' },
  { value: 'en', labelKey: 'language.en' },
] as const;

const LanguageSwitcher = () => {
  const { t } = useTranslation();

  const current = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  return (
    <Select
      className="lang-switch"
      value={current}
      onChange={(value) => i18n.changeLanguage(value)}
      options={languageOptions.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      }))}
    />
  );
};

export default LanguageSwitcher;
