import { Menu } from 'antd';
import type { NavItem } from '../types/nav';

type TopNavProps = {
  items: NavItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

const TopNav = ({ items, activeKey, onChange }: TopNavProps) => (
  <Menu
    mode="horizontal"
    className="top-menu"
    items={items.map((item) => ({ key: item.key, label: item.name }))}
    selectedKeys={activeKey ? [activeKey] : []}
    onClick={(event) => onChange(event.key)}
  />
);

export default TopNav;
