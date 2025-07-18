import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  FireOutlined,
  BulbOutlined,
  TagsOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '总览仪表板',
    },
    {
      key: '/hot-trends',
      icon: <FireOutlined />,
      label: '热门趋势',
    },
    {
      key: '/niche-projects',
      icon: <BulbOutlined />,
      label: '小众创新',
    },
    {
      key: '/tech-keywords',
      icon: <TagsOutlined />,
      label: '技术关键词',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: '系统管理',
    }
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Sider width={200} style={{ background: '#fff' }}>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default Sidebar;