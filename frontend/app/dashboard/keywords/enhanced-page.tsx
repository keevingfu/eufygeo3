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
  Popconfirm,
  Row,
  Col,
  Statistic,
  Progress,
  Tooltip,
  Alert,
  Drawer,
  Descriptions,
  List,
  Badge,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  BulbOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import ReactECharts from 'echarts-for-react';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface PriorityInfo {
  level: string;
  minVolume: number;
  maxVolume?: number;
  description: string;
  resourceAllocation: string;
}

interface AIOFactors {
  questionTypeMatch: number;
  searchIntentClarity: number;
  contentStructure: number;
  competitiveEnvironment: number;
}

interface AIOAnalysis {
  score: number;
  factors: AIOFactors;
  recommendations: string[];
  predictedPerformance: string;
}

interface Keyword {
  id: string;
  text: string;
  searchVolume: number;
  cpc: number;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  priorityInfo?: PriorityInfo;
  aioScore: number;
  aioAnalysis?: AIOAnalysis;
}

interface PriorityDistribution {
  counts: {
    P0: number;
    P1: number;
    P2: number;
    P3: number;
    P4: number;
    P5: number;
    total: number;
  };
  percentages: {
    P0: string;
    P1: string;
    P2: string;
    P3: string;
    P4: string;
    P5: string;
  };
}

const priorityColors: { [key: string]: string } = {
  P0: '#f5222d',  // 深红
  P1: '#fa541c',  // 红色
  P2: '#fa8c16',  // 橙色
  P3: '#faad14',  // 黄色
  P4: '#1890ff',  // 蓝色
  P5: '#8c8c8c',  // 灰色
};

const statusColors: { [key: string]: string } = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  DRAFT: 'warning',
};

const performanceColors: { [key: string]: string } = {
  HIGH: 'success',
  MEDIUM: 'warning',
  LOW: 'error',
};

export default function EnhancedKeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [distribution, setDistribution] = useState<PriorityDistribution | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();

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
              keywords(input: { includeAnalysis: true }) {
                items {
                  id
                  text
                  searchVolume
                  cpc
                  priority
                  status
                  aioScore
                  priorityInfo {
                    level
                    minVolume
                    maxVolume
                    description
                    resourceAllocation
                  }
                  aioAnalysis {
                    score
                    factors {
                      questionTypeMatch
                      searchIntentClarity
                      contentStructure
                      competitiveEnvironment
                    }
                    recommendations
                    predictedPerformance
                  }
                  createdAt
                  updatedAt
                }
                total
              }
              keywordPriorityDistribution {
                counts {
                  P0 P1 P2 P3 P4 P5 total
                }
                percentages {
                  P0 P1 P2 P3 P4 P5
                }
              }
            }
          `,
        }),
      });

      const data = await response.json();
      if (data.data && data.data.keywords) {
        setKeywords(data.data.keywords.items);
      }
      if (data.data && data.data.keywordPriorityDistribution) {
        setDistribution(data.data.keywordPriorityDistribution);
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
              id text searchVolume cpc priority status aioScore
            }
          }
        `
        : `
          mutation CreateKeyword($input: CreateKeywordInput!) {
            createKeyword(input: $input) {
              id text searchVolume cpc priority status aioScore
            }
          }
        `;

      const input = editingKeyword
        ? { id: editingKeyword.id, ...values }
        : values;

      const response = await fetch('http://localhost:4004/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: { input },
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

  // 查看详情
  const showDetail = (record: Keyword) => {
    setSelectedKeyword(record);
    setDetailDrawerVisible(true);
  };

  // 优先级分布图表配置
  const getPriorityChartOption = () => {
    if (!distribution) return {};
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '关键词数量',
          type: 'bar',
          data: [
            { value: distribution.counts.P0, itemStyle: { color: priorityColors.P0 } },
            { value: distribution.counts.P1, itemStyle: { color: priorityColors.P1 } },
            { value: distribution.counts.P2, itemStyle: { color: priorityColors.P2 } },
            { value: distribution.counts.P3, itemStyle: { color: priorityColors.P3 } },
            { value: distribution.counts.P4, itemStyle: { color: priorityColors.P4 } },
            { value: distribution.counts.P5, itemStyle: { color: priorityColors.P5 } },
          ],
          label: {
            show: true,
            position: 'top',
            formatter: '{c}'
          }
        }
      ]
    };
  };

  // AIO因素雷达图配置
  const getAIORadarOption = (analysis: AIOAnalysis) => {
    return {
      tooltip: {},
      radar: {
        indicator: [
          { name: '问题类型', max: 30 },
          { name: '搜索意图', max: 25 },
          { name: '内容结构', max: 25 },
          { name: '竞争环境', max: 20 }
        ]
      },
      series: [{
        name: 'AIO适配性',
        type: 'radar',
        data: [{
          value: [
            analysis.factors.questionTypeMatch,
            analysis.factors.searchIntentClarity,
            analysis.factors.contentStructure,
            analysis.factors.competitiveEnvironment
          ],
          name: 'AIO因素分析'
        }]
      }]
    };
  };

  const columns = [
    {
      title: '关键词',
      dataIndex: 'text',
      key: 'text',
      width: 300,
      render: (text: string, record: Keyword) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Space size={4}>
            <Tag color={priorityColors[record.priority]} style={{ marginRight: 0 }}>
              {record.priority}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.searchVolume.toLocaleString()} 搜索/月
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: string, record: Keyword) => (
        <Tooltip title={record.priorityInfo?.description}>
          <Tag 
            color={priorityColors[priority]} 
            style={{ cursor: 'help' }}
          >
            {priority}
          </Tag>
        </Tooltip>
      ),
      filters: [
        { text: 'P0 - 战略核心', value: 'P0' },
        { text: 'P1 - 重点投入', value: 'P1' },
        { text: 'P2 - 稳定发展', value: 'P2' },
        { text: 'P3 - 选择投入', value: 'P3' },
        { text: 'P4 - 长尾机会', value: 'P4' },
        { text: 'P5 - 精准定位', value: 'P5' },
      ],
      onFilter: (value: any, record: Keyword) => record.priority === value,
    },
    {
      title: (
        <Space>
          AIO评分
          <Tooltip title="AI Overview适配性评分，满分100分">
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'aioScore',
      key: 'aioScore',
      width: 150,
      render: (score: number, record: Keyword) => (
        <Space>
          <Progress
            percent={score}
            steps={5}
            size="small"
            strokeColor={score >= 70 ? '#52c41a' : score >= 40 ? '#faad14' : '#f5222d'}
            style={{ width: 80 }}
          />
          <Tag color={performanceColors[record.aioAnalysis?.predictedPerformance || 'LOW']}>
            {record.aioAnalysis?.predictedPerformance}
          </Tag>
        </Space>
      ),
      sorter: (a: Keyword, b: Keyword) => a.aioScore - b.aioScore,
    },
    {
      title: 'CPC',
      dataIndex: 'cpc',
      key: 'cpc',
      width: 100,
      render: (cpc: number) => `$${cpc.toFixed(2)}`,
      sorter: (a: Keyword, b: Keyword) => a.cpc - b.cpc,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {status === 'ACTIVE' ? '活跃' : status === 'INACTIVE' ? '非活跃' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Keyword) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<BulbOutlined />}
            onClick={() => showDetail(record)}
          >
            分析
          </Button>
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

  // 编辑关键词
  const handleEdit = (record: Keyword) => {
    setEditingKeyword(record);
    form.setFieldsValue({
      text: record.text,
      searchVolume: record.searchVolume,
      cpc: record.cpc,
      status: record.status,
    });
    setModalVisible(true);
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

  return (
    <div style={{ padding: 24 }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总关键词数"
              value={distribution?.counts.total || 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高优先级 (P0-P1)"
              value={(distribution?.counts.P0 || 0) + (distribution?.counts.P1 || 0)}
              valueStyle={{ color: priorityColors.P0 }}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高AIO潜力"
              value={keywords.filter(k => k.aioScore >= 70).length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card title="优先级分布" bodyStyle={{ padding: 0, height: 150 }}>
            <ReactECharts 
              option={getPriorityChartOption()} 
              style={{ height: '100%' }}
              notMerge={true}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>关键词管理 (增强版)</Title>
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
          </Space>
        </div>

        <Alert 
          message="P0-P5自动分级系统已启用" 
          description="关键词优先级将根据搜索量自动计算，AIO评分将评估在Google AI Overview中的表现潜力。"
          type="info" 
          showIcon 
          closable
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={keywords}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
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
            <Input placeholder="例如: how to install eufy security camera" />
          </Form.Item>

          <Form.Item
            name="searchVolume"
            label="月搜索量"
            rules={[{ required: true, message: '请输入搜索量' }]}
            extra="系统将根据搜索量自动分配P0-P5优先级"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="例如: 50000"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
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
              formatter={value => `$ ${value}`}
              parser={value => value!.replace(/\$\s?/g, '')}
            />
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

      {/* 详情抽屉 */}
      <Drawer
        title="关键词分析详情"
        placement="right"
        width={600}
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
      >
        {selectedKeyword && (
          <div>
            <Descriptions title="基本信息" bordered column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="关键词">
                <Text strong>{selectedKeyword.text}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="月搜索量">
                {selectedKeyword.searchVolume.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="CPC">
                ${selectedKeyword.cpc.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={priorityColors[selectedKeyword.priority]}>
                  {selectedKeyword.priority}
                </Tag>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {selectedKeyword.priorityInfo?.description}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="资源分配建议">
                {selectedKeyword.priorityInfo?.resourceAllocation}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <Title level={5}>AIO适配性分析</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="AIO总分"
                      value={selectedKeyword.aioScore}
                      suffix="/ 100"
                      valueStyle={{ 
                        color: selectedKeyword.aioScore >= 70 ? '#52c41a' : 
                               selectedKeyword.aioScore >= 40 ? '#faad14' : '#f5222d' 
                      }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="预测表现"
                      value={selectedKeyword.aioAnalysis?.predictedPerformance || '-'}
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>

            {selectedKeyword.aioAnalysis && (
              <>
                <div style={{ height: 300, marginBottom: 24 }}>
                  <ReactECharts 
                    option={getAIORadarOption(selectedKeyword.aioAnalysis)} 
                    style={{ height: '100%' }}
                  />
                </div>

                <div>
                  <Title level={5}>优化建议</Title>
                  <List
                    dataSource={selectedKeyword.aioAnalysis.recommendations}
                    renderItem={item => (
                      <List.Item>
                        <Space>
                          <InfoCircleOutlined style={{ color: '#1890ff' }} />
                          <Text>{item}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}