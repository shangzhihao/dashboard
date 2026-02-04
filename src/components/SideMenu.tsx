import { Menu } from 'antd';
import type { MenuProps } from 'antd';

type SideMenuProps = {
  items: NonNullable<MenuProps['items']>;
  openKeys: string[];
  onOpenChange: (keys: string[]) => void;
};

const SideMenu = ({ items, openKeys, onOpenChange }: SideMenuProps) => (
  <Menu
    mode="inline"
    className="side-menu"
    items={items}
    openKeys={openKeys}
    onOpenChange={onOpenChange}
  />
);

export default SideMenu;
