'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Badge,
  message
} from 'antd';
import {
  DashboardOutlined,
  SearchOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TeamOutlined,
  ExportOutlined,
  GlobalOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  // 检查认证
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_info');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (user) {
      setUserInfo(JSON.parse(user));
    }
  }, [router]);

  // 菜单项配置
  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/dashboard/keywords',
      icon: <SearchOutlined />,
      label: '关键词管理',
    },
    {
      key: '/dashboard/content',
      icon: <FileTextOutlined />,
      label: 'AI 内容生成',
    },
    {
      key: '/dashboard/workflow',
      icon: <ProjectOutlined />,
      label: '30天工作流',
    },
    {
      key: '/dashboard/analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/dashboard/team',
      icon: <TeamOutlined />,
      label: '团队协作',
    },
    {
      key: '/dashboard/export',
      icon: <ExportOutlined />,
      label: '导出报告',
    },
    {
      type: 'divider',
    },
    {
      key: 'multilingual',
      icon: <GlobalOutlined />,
      label: '多语言设置',
      children: [
        { key: 'zh-cn', label: '简体中文' },
        { key: 'en', label: 'English' },
        { key: 'ja', label: '日本語' },
        { key: 'ko', label: '한국어' },
      ],
    },
  ];

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  // 处理菜单点击
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/')) {
      router.push(key);
    } else if (key === 'zh-cn' || key === 'en' || key === 'ja' || key === 'ko') {
      message.info(`切换语言: ${key}`);
    }
  };

  // 处理用户菜单
  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      message.success('已退出登录');
      router.push('/login');
    } else if (key === 'profile') {
      message.info('个人资料功能开发中');
    } else if (key === 'settings') {
      message.info('设置功能开发中');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={256}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
        }}>
          <Text style={{ 
            color: '#fff', 
            fontSize: collapsed ? 16 : 20, 
            fontWeight: 'bold' 
          }}>
            {collapsed ? 'GEO' : 'Eufy GEO'}
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 80 : 256, transition: 'all 0.2s' }}>
        <Header 
          style={{ 
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            position: 'sticky',
            top: 0,
            zIndex: 999,
          }}
        >
          <Space>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: 18, cursor: 'pointer' }
            })}
          </Space>

          <Space size={24}>
            <Badge count={5} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            
            <Dropdown
              menu={{ 
                items: userMenuItems,
                onClick: handleUserMenuClick
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <Text>{userInfo?.name || userInfo?.email || '用户'}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content
          style={{
            margin: '24px',
            minHeight: 280,
            background: '#f0f2f5',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}