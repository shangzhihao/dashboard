import { Card, Typography } from 'antd';

const { Title } = Typography;

type ComingSoonPanelProps = {
  title: string;
};

const ComingSoonPanel = ({ title }: ComingSoonPanelProps) => (
  <Card className="panel" styles={{ body: { padding: 18 } }}>
    <div className="panel-header">
      <Title level={5} className="panel-title">
        {title}
      </Title>
    </div>
    <div className="panel-empty">Coming soon</div>
    <div className="panel-footer">Copyright © 2018 - 2026 期货数据中心</div>
  </Card>
);

export default ComingSoonPanel;
