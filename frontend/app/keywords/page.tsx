'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber,
  message,
  Card,
  Typography,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  BarChartOutlined,
  TeamOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title } = Typography;
const { Option } = Select;

interface Keyword {
  id: string;
  text: string;
  searchVolume: number;
  cpc: number;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const priorityColors: { [key: string]: string } = {
  P0: 'red',
  P1: 'orange',
  P2: 'blue',
  P3: 'green',
  P4: 'default',
};

const statusColors: { [key: string]: string } = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  DRAFT: 'warning',
};

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  // 检查认证
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // 获取关键词列表
  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4004/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query {
              keywords {
                items {
                  id
                  text
                  searchVolume
                  cpc
                  priority
                  status
                  createdAt
                  updatedAt
                }
                total
              }
            }
          `,
        }),
      });

      const data = await response.json();
      if (data.data && data.data.keywords) {
        setKeywords(data.data.keywords.items);
      }
    } catch (error) {
      message.error('获取关键词列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      const mutation = editingKeyword
        ? `
          mutation UpdateKeyword($input: UpdateKeywordInput!) {
            updateKeyword(input: $input) {
              id text searchVolume cpc priority status
            }
          }
        `
        : `
          mutation CreateKeyword($input: CreateKeywordInput!) {
            createKeyword(input: $input) {
              id text searchVolume cpc priority status
            }
          }
        `;

      const variables = editingKeyword
        ? { input: { id: editingKeyword.id, ...values } }
        : { input: values };

      const response = await fetch('http://localhost:4004/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      message.success(editingKeyword ? '更新成功' : '创建成功');
      setModalVisible(false);
      form.resetFields();
      setEditingKeyword(null);
      fetchKeywords();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 删除关键词
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch('http://localhost:4004/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation DeleteKeyword($id: String!) {
              deleteKeyword(id: $id)
            }
          `,
          variables: { id },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      message.success('删除成功');
      fetchKeywords();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 编辑关键词
  const handleEdit = (record: Keyword) => {
    setEditingKeyword(record);
    form.setFieldsValue({
      text: record.text,
      searchVolume: record.searchVolume,
      cpc: record.cpc,
      priority: record.priority,
      status: record.status,
    });
    setModalVisible(true);
  };

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    router.push('/login');
  };

  const columns = [
    {
      title: '关键词',
      dataIndex: 'text',
      key: 'text',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索关键词"
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: '100%' }}
          >
            搜索
          </Button>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
    },
    {
      title: '搜索量',
      dataIndex: 'searchVolume',
      key: 'searchVolume',
      sorter: (a: Keyword, b: Keyword) => a.searchVolume - b.searchVolume,
      render: (volume: number) => volume.toLocaleString(),
    },
    {
      title: 'CPC',
      dataIndex: 'cpc',
      key: 'cpc',
      sorter: (a: Keyword, b: Keyword) => a.cpc - b.cpc,
      render: (cpc: number) => `$${cpc.toFixed(2)}`,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      filters: [
        { text: 'P0', value: 'P0' },
        { text: 'P1', value: 'P1' },
        { text: 'P2', value: 'P2' },
        { text: 'P3', value: 'P3' },
        { text: 'P4', value: 'P4' },
      ],
      render: (priority: string) => (
        <Tag color={priorityColors[priority] || 'default'}>{priority}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: '活跃', value: 'ACTIVE' },
        { text: '非活跃', value: 'INACTIVE' },
        { text: '草稿', value: 'DRAFT' },
      ],
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {status === 'ACTIVE' ? '活跃' : status === 'INACTIVE' ? '非活跃' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Keyword) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个关键词吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>关键词管理</Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchKeywords}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingKeyword(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              新增关键词
            </Button>
            <Button 
              icon={<EditOutlined />}
              onClick={() => router.push('/content')}
              type="dashed"
            >
              AI 内容生成
            </Button>
            <Button 
              icon={<BarChartOutlined />}
              onClick={() => router.push('/analytics')}
              type="dashed"
            >
              数据分析
            </Button>
            <Button 
              icon={<TeamOutlined />}
              onClick={() => router.push('/team')}
              type="dashed"
            >
              团队协作
            </Button>
            <Button 
              icon={<ExportOutlined />}
              onClick={() => router.push('/export')}
              type="dashed"
            >
              导出报告
            </Button>
            <Button onClick={handleLogout}>
              退出登录
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={keywords}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingKeyword ? '编辑关键词' : '新增关键词'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingKeyword(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="text"
            label="关键词"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Input placeholder="例如: eufy security camera" />
          </Form.Item>

          <Form.Item
            name="searchVolume"
            label="搜索量"
            rules={[{ required: true, message: '请输入搜索量' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="例如: 50000"
            />
          </Form.Item>

          <Form.Item
            name="cpc"
            label="CPC (美元)"
            rules={[{ required: true, message: '请输入 CPC' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              placeholder="例如: 2.50"
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="选择优先级">
              <Option value="P0">P0 - 最高优先级</Option>
              <Option value="P1">P1 - 高优先级</Option>
              <Option value="P2">P2 - 中等优先级</Option>
              <Option value="P3">P3 - 低优先级</Option>
              <Option value="P4">P4 - 最低优先级</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择状态">
              <Option value="ACTIVE">活跃</Option>
              <Option value="INACTIVE">非活跃</Option>
              <Option value="DRAFT">草稿</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingKeyword ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
                setEditingKeyword(null);
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}