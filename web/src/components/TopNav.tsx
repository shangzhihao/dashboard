import { Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NavItem } from '../types/nav';

type TopNavProps = {
  items: NavItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

const TopNav = ({ items, activeKey, onChange }: TopNavProps) => {
  const { t } = useTranslation();

  return (
    <Menu
      mode="horizontal"
      className="top-menu"
      items={items.map((item) => ({
        key: item.key,
        label: item.nameKey ? t(item.nameKey) : item.name || item.key,
      }))}
      selectedKeys={activeKey ? [activeKey] : []}
      onClick={(event) => onChange(event.key)}
    />
  );
};

export default TopNav;
