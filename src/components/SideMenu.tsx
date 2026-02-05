import { Menu } from 'antd';
import type { MenuProps } from 'antd';

type SideMenuProps = {
  items: NonNullable<MenuProps['items']>;
  openKeys: string[];
  onOpenChange: (keys: string[]) => void;
  selectedKey: string;
  onSelectKey: (key: string) => void;
};

const SideMenu = ({
  items,
  openKeys,
  onOpenChange,
  selectedKey,
  onSelectKey,
}: SideMenuProps) => (
  <Menu
    mode="inline"
    className="side-menu"
    items={items}
    openKeys={openKeys}
    selectedKeys={selectedKey ? [selectedKey] : []}
    onOpenChange={onOpenChange}
    onSelect={(info) => onSelectKey(info.key)}
  />
);

export default SideMenu;
