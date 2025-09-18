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
      // 调用认证 API
      const response = await fetch('http://localhost:4003/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation Login($input: LoginInputType!) {
              login(input: $input) {
                access_token
                user {
                  id
                  email
                  username
                  role
                }
              }
            }
          `,
          variables: {
            input: {
              email: values.email,
              password: values.password,
            },
          },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      // 保存 token 到 localStorage
      localStorage.setItem('auth_token', data.data.login.access_token);
      localStorage.setItem('user_info', JSON.stringify(data.data.login.user));

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