import { Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { normalizeLanguage } from '../i18n';

const { Title } = Typography;

type ComingSoonPanelProps = {
  title: string;
};

const ComingSoonPanel = ({ title }: ComingSoonPanelProps) => {
  const { t, i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const toggleText = language === 'en' ? '中' : 'EN';

  return (
    <Card className="panel" styles={{ body: { padding: 18 } }}>
      <div className="panel-header">
        <Title level={5} className="panel-title">
          {title}
        </Title>
      </div>
      <div className="panel-empty">{t('common.comingSoon')}</div>
      <div className="panel-footer">
        {t('footer.copyright', { yearStart: 2018, yearEnd: 2026 })}
        {' '}
        <button
          type="button"
          className="footer-lang-toggle"
          onClick={() => i18n.changeLanguage(language === 'en' ? 'zh' : 'en')}
        >
          {toggleText}
        </button>
      </div>
    </Card>
  );
};

export default ComingSoonPanel;
