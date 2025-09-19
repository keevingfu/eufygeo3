'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      // Mock authentication for demo (no backend required)
      const mockUsers = [
        { email: 'admin@eufy.com', password: 'test123', role: 'ADMIN', username: 'Admin User' },
        { email: 'user@eufy.com', password: 'test123', role: 'USER', username: 'Regular User' }
      ];

      const user = mockUsers.find(u => u.email === values.email && u.password === values.password);

      if (!user) {
        throw new Error('用户名或密码错误');
      }

      // Generate mock token and user data
      const mockToken = `mock-jwt-token-${Buffer.from(JSON.stringify({ email: user.email })).toString('base64')}`;
      const mockUserData = {
        id: user.email === 'admin@eufy.com' ? '1' : '2',
        email: user.email,
        username: user.username,
        role: user.role
      };

      // 保存 token 到 localStorage
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user_info', JSON.stringify(mockUserData));

      message.success('登录成功！');
      
      // 跳转到仪表板页面
      router.push('/dashboard');
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Card 
        style={{ width: 400, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>Eufy GEO Platform</Title>
          <Text type="secondary">AI 驱动的关键词管理系统</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱!' },
              { type: 'email', message: '请输入有效的邮箱地址!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="邮箱" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            测试账号: admin@eufy.com / test123
          </Text>
        </div>
      </Card>
    </div>
  );
}