import { Button } from 'antd';
import type { NavItem } from '../types/nav';

type PillNavProps = {
  items: NavItem[];
  activeKey: string;
  onClick: (item: NavItem) => void;
};

const PillNav = ({ items, activeKey, onClick }: PillNavProps) => (
  <div className="pill-grid">
    {items.map((item) => (
      <Button
        key={item.key}
        type={item.key === activeKey ? 'primary' : 'default'}
        className="pill"
        onClick={() => onClick(item)}
      >
        {item.name}
      </Button>
    ))}
  </div>
);

export default PillNav;
