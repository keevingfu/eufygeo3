'use client';

import { Button, Space } from 'antd';
import Link from 'next/link';
import { LoginOutlined, DashboardOutlined } from '@ant-design/icons';

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <h1 style={{ fontSize: 48, marginBottom: 24, fontWeight: 'bold' }}>
        Eufy GEO Platform
      </h1>
      <p style={{ fontSize: 20, marginBottom: 48, opacity: 0.9 }}>
        AI 驱动的 SEO 内容管理平台
      </p>
      <Space size="large">
        <Link href="/login">
          <Button 
            type="primary" 
            size="large" 
            icon={<LoginOutlined />}
            style={{ minWidth: 140 }}
          >
            登录
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button 
            size="large" 
            icon={<DashboardOutlined />}
            style={{ minWidth: 140 }}
          >
            进入平台
          </Button>
        </Link>
      </Space>
      <div style={{ marginTop: 80, opacity: 0.7 }}>
        <p>🚀 AI 内容生成 | 📊 数据分析 | 👥 团队协作 | 🌍 多语言支持</p>
      </div>
    </div>
  );
}