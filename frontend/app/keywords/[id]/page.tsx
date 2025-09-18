'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Statistic,
  Descriptions,
  Tag,
  Alert,
  Switch,
  InputNumber,
  Form,
  message,
  Breadcrumb,
  Tabs,
  Timeline,
  Avatar,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ExportOutlined,
  HistoryOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { PerformanceChart } from '@/components/charts/performance-chart';
import {
  PriorityBadge,
  AIOStatusBadge,
  KeywordStatusBadge,
  ChannelBadge,
  TierBadge,
} from '@/components/keyword/keyword-badge';
import { Keyword, AIOConfig, MetricsTrend } from '@/types/keyword';
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatDateTime,
  getRelativeTime,
} from '@/lib/utils';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function KeywordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const keywordId = params?.id as string;

  const [keyword, setKeyword] = useState<Keyword | null>(null);
  const [loading, setLoading] = useState(true);
  const [aioConfigForm] = Form.useForm();
  const [isEditingAIO, setIsEditingAIO] = useState(false);

  // 模拟数据加载
  useEffect(() => {
    if (keywordId) {
      loadKeywordDetail(keywordId);
    }
  }, [keywordId]);

  const loadKeywordDetail = async (id: string) => {
    setLoading(true);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟关键词详细数据
      const mockKeyword: Keyword = {
        id,
        term: '智能门锁安全防盗',
        priority: 'P1' as any,
        status: 'ACTIVE' as any,
        channelType: 'GOOGLE' as any,
        tier: 2,
        aioStatus: 'ACTIVE' as any,
        searchVolume: 8500,
        competition: 0.73,
        cpc: 3.45,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-03-15T14:22:00Z',
        parentId: 'parent-keyword-1',
        children: [
          { id: 'child-1', term: '智能门锁品牌推荐', priority: 'P2' as any, status: 'ACTIVE' as any, channelType: 'GOOGLE' as any, tier: 3, aioStatus: 'ACTIVE' as any, searchVolume: 2200, competition: 0.65, cpc: 2.80, createdAt: '2024-02-01T10:00:00Z', updatedAt: '2024-03-10T12:00:00Z' },
          { id: 'child-2', term: '智能门锁价格对比', priority: 'P2' as any, status: 'ACTIVE' as any, channelType: 'GOOGLE' as any, tier: 3, aioStatus: 'PENDING' as any, searchVolume: 1800, competition: 0.58, cpc: 2.35, createdAt: '2024-02-05T14:30:00Z', updatedAt: '2024-03-12T16:45:00Z' },
        ],
        metrics: {
          id: 'metrics-1',
          keywordId: id,
          date: new Date().toISOString(),
          impressions: 45600,
          clicks: 2280,
          ctr: 0.05,
          position: 3.2,
          conversions: 68,
          revenue: 2040.50,
          createdAt: new Date().toISOString(),
        },
        aioConfig: {
          id: 'aio-config-1',
          keywordId: id,
          enabled: true,
          targetPosition: 3,
          maxBid: 4.50,
          budget: 500.00,
          createdAt: '2024-01-20T09:00:00Z',
          updatedAt: '2024-03-15T14:22:00Z',
        },
      };

      setKeyword(mockKeyword);
      
      if (mockKeyword.aioConfig) {
        aioConfigForm.setFieldsValue(mockKeyword.aioConfig);
      }
    } catch (error) {
      message.error('加载关键词详情失败');
      console.error('Failed to load keyword detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // 模拟性能趋势数据
  const mockPerformanceData: MetricsTrend[] = [
    {
      metric: 'clicks',
      change: 340,
      changePercent: 17.5,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: Math.floor(Math.random() * 100) + 50 + i * 2,
      })),
    },
    {
      metric: 'impressions',
      change: 2100,
      changePercent: 4.8,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: Math.floor(Math.random() * 2000) + 1000 + i * 20,
      })),
    },
    {
      metric: 'ctr',
      change: -0.003,
      changePercent: -5.2,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: Math.random() * 0.02 + 0.04 + (Math.sin(i / 5) * 0.01),
      })),
    },
    {
      metric: 'position',
      change: -0.8,
      changePercent: -20.0,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: Math.random() * 2 + 2.5 + (Math.sin(i / 7) * 0.5),
      })),
    },
  ];

  const handleAIOToggle = async (enabled: boolean) => {
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setKeyword(prev => prev ? {
        ...prev,
        aioStatus: enabled ? 'ACTIVE' : 'DISABLED',
        aioConfig: prev.aioConfig ? { ...prev.aioConfig, enabled } : undefined,
      } : null);
      
      message.success(`AIO ${enabled ? '启用' : '禁用'}成功`);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleAIOConfigSave = async (values: any) => {
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setKeyword(prev => prev ? {
        ...prev,
        aioConfig: { ...prev.aioConfig!, ...values },
      } : null);
      
      setIsEditingAIO(false);
      message.success('AIO 配置保存成功');
    } catch (error) {
      message.error('保存失败');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card loading />
      </div>
    );
  }

  if (!keyword) {
    return (
      <div className="p-6">
        <Alert
          message="关键词不存在"
          description="请检查 URL 是否正确，或返回关键词列表页面。"
          type="error"
          showIcon
          action={
            <Button onClick={() => router.push('/keywords')}>
              返回列表
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 面包屑导航 */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/keywords')}
            className="p-0"
          >
            关键词管理
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{keyword.term}</Breadcrumb.Item>
      </Breadcrumb>

      {/* 关键词基本信息 */}
      <Card className="mb-6">
        <Row gutter={[24, 16]}>
          <Col xs={24} lg={16}>
            <Space direction="vertical" className="w-full">
              <div>
                <Title level={2} className="mb-2">
                  {keyword.term}
                </Title>
                <Space wrap>
                  <PriorityBadge priority={keyword.priority} />
                  <KeywordStatusBadge status={keyword.status} />
                  <AIOStatusBadge status={keyword.aioStatus} />
                  <ChannelBadge channelType={keyword.channelType} />
                  <TierBadge tier={keyword.tier} />
                </Space>
              </div>
              
              <Descriptions column={2} size="small">
                <Descriptions.Item label="搜索量">
                  {formatNumber(keyword.searchVolume)}
                </Descriptions.Item>
                <Descriptions.Item label="竞争度">
                  {formatPercentage(keyword.competition)}
                </Descriptions.Item>
                <Descriptions.Item label="CPC">
                  {formatCurrency(keyword.cpc)}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {getRelativeTime(keyword.updatedAt)}
                </Descriptions.Item>
              </Descriptions>
            </Space>
          </Col>
          
          <Col xs={24} lg={8}>
            <Space direction="vertical" className="w-full">
              <Button
                type="primary"
                icon={<EditOutlined />}
                block
              >
                编辑关键词
              </Button>
              
              <Button
                icon={<ExportOutlined />}
                block
              >
                导出数据
              </Button>
              
              {keyword.aioConfig && (
                <Card size="small" title="AIO 快速控制">
                  <Space direction="vertical" className="w-full">
                    <div className="flex justify-between items-center">
                      <Text>AIO 状态:</Text>
                      <Switch
                        checked={keyword.aioConfig.enabled}
                        onChange={handleAIOToggle}
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
                      />
                    </div>
                    
                    <Button
                      type="link"
                      icon={<SettingOutlined />}
                      onClick={() => setIsEditingAIO(true)}
                      className="p-0"
                    >
                      配置 AIO 参数
                    </Button>
                  </Space>
                </Card>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 核心指标卡片 */}
      {keyword.metrics && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="展现量"
                value={keyword.metrics.impressions}
                formatter={(value) => formatNumber(value as number)}
                suffix={
                  <Tooltip title="较上期增长 4.8%">
                    <TrendingUpOutlined className="text-green-500" />
                  </Tooltip>
                }
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="点击量"
                value={keyword.metrics.clicks}
                formatter={(value) => formatNumber(value as number)}
                suffix={
                  <Tooltip title="较上期增长 17.5%">
                    <TrendingUpOutlined className="text-green-500" />
                  </Tooltip>
                }
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="点击率"
                value={keyword.metrics.ctr}
                formatter={(value) => formatPercentage(value as number)}
                suffix={
                  <Tooltip title="较上期下降 5.2%">
                    <TrendingDownOutlined className="text-red-500" />
                  </Tooltip>
                }
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均排名"
                value={keyword.metrics.position}
                precision={1}
                suffix={
                  <Tooltip title="较上期提升 20%">
                    <TrendingUpOutlined className="text-green-500" />
                  </Tooltip>
                }
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 详细信息 Tabs */}
      <Card>
        <Tabs defaultActiveKey="performance">
          <TabPane tab="性能趋势" key="performance">
            <PerformanceChart
              data={mockPerformanceData}
              title="关键词性能趋势"
              height={400}
            />
          </TabPane>
          
          <TabPane tab="AIO 配置" key="aio-config">
            {keyword.aioConfig ? (
              <Form
                form={aioConfigForm}
                layout="vertical"
                onFinish={handleAIOConfigSave}
                disabled={!isEditingAIO}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="目标排名"
                      name="targetPosition"
                      rules={[{ required: true, message: '请输入目标排名' }]}
                    >
                      <InputNumber
                        min={1}
                        max={10}
                        precision={0}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="最大出价 (¥)"
                      name="maxBid"
                      rules={[{ required: true, message: '请输入最大出价' }]}
                    >
                      <InputNumber
                        min={0}
                        precision={2}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="日预算 (¥)"
                      name="budget"
                      rules={[{ required: true, message: '请输入日预算' }]}
                    >
                      <InputNumber
                        min={0}
                        precision={2}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col xs={24} sm={12}>
                    <Form.Item label="启用状态" name="enabled" valuePropName="checked">
                      <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Space>
                  {isEditingAIO ? (
                    <>
                      <Button type="primary" htmlType="submit">
                        保存配置
                      </Button>
                      <Button onClick={() => setIsEditingAIO(false)}>
                        取消
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditingAIO(true)}>
                      编辑配置
                    </Button>
                  )}
                </Space>
              </Form>
            ) : (
              <Alert
                message="未配置 AIO"
                description="该关键词尚未配置 AIO 自动优化，点击下方按钮开始配置。"
                type="info"
                showIcon
                action={
                  <Button type="primary">
                    配置 AIO
                  </Button>
                }
              />
            )}
          </TabPane>
          
          <TabPane tab="子关键词" key="children">
            {keyword.children && keyword.children.length > 0 ? (
              <Row gutter={[16, 16]}>
                {keyword.children.map((child) => (
                  <Col xs={24} sm={12} md={8} key={child.id}>
                    <Card
                      size="small"
                      title={child.term}
                      extra={<PriorityBadge priority={child.priority} />}
                      hoverable
                      onClick={() => router.push(`/keywords/${child.id}`)}
                    >
                      <Space direction="vertical" size={4} className="w-full">
                        <div className="flex justify-between">
                          <Text type="secondary">搜索量:</Text>
                          <Text>{formatNumber(child.searchVolume)}</Text>
                        </div>
                        <div className="flex justify-between">
                          <Text type="secondary">CPC:</Text>
                          <Text>{formatCurrency(child.cpc)}</Text>
                        </div>
                        <div className="flex justify-between items-center">
                          <Text type="secondary">AIO:</Text>
                          <AIOStatusBadge status={child.aioStatus} />
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Alert
                message="无子关键词"
                description="该关键词暂无子关键词。"
                type="info"
                showIcon
              />
            )}
          </TabPane>
          
          <TabPane tab="操作历史" key="history">
            <Timeline
              items={[
                {
                  dot: <CheckCircleOutlined className="text-green-500" />,
                  children: (
                    <div>
                      <Text strong>AIO 配置更新</Text>
                      <br />
                      <Text type="secondary">目标排名从 5 调整为 3</Text>
                      <br />
                      <Text type="secondary" className="text-xs">
                        {formatDateTime('2024-03-15T14:22:00Z')} · 管理员
                      </Text>
                    </div>
                  ),
                },
                {
                  dot: <ExclamationCircleOutlined className="text-orange-500" />,
                  children: (
                    <div>
                      <Text strong>优先级调整</Text>
                      <br />
                      <Text type="secondary">从 P2 提升至 P1</Text>
                      <br />
                      <Text type="secondary" className="text-xs">
                        {formatDateTime('2024-03-10T09:15:00Z')} · 运营团队
                      </Text>
                    </div>
                  ),
                },
                {
                  dot: <CheckCircleOutlined className="text-blue-500" />,
                  children: (
                    <div>
                      <Text strong>关键词创建</Text>
                      <br />
                      <Text type="secondary">初始优先级 P2，目标排名 5</Text>
                      <br />
                      <Text type="secondary" className="text-xs">
                        {formatDateTime('2024-01-15T10:30:00Z')} · 系统
                      </Text>
                    </div>
                  ),
                },
              ]}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}