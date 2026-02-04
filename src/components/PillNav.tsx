import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NavItem } from '../types/nav';

type PillNavProps = {
  items: NavItem[];
  activeKey: string;
  onClick: (item: NavItem) => void;
};

const PillNav = ({ items, activeKey, onClick }: PillNavProps) => {
  const { t } = useTranslation();

  return (
    <div className="pill-grid">
      {items.map((item) => (
        <Button
          key={item.key}
          type={item.key === activeKey ? 'primary' : 'default'}
        className="pill"
        onClick={() => onClick(item)}
      >
        {item.nameKey ? t(item.nameKey) : item.name || item.key}
      </Button>
    ))}
    </div>
  );
};

export default PillNav;
