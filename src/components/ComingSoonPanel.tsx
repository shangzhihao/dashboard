import { Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

type ComingSoonPanelProps = {
  title: string;
};

const ComingSoonPanel = ({ title }: ComingSoonPanelProps) => {
  const { t } = useTranslation();

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
      </div>
    </Card>
  );
};

export default ComingSoonPanel;
