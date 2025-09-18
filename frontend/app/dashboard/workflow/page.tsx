'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Timeline, 
  Progress, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Typography,
  Tabs,
  List,
  Tooltip,
  Badge,
  Drawer,
  Descriptions,
  Steps,
  Alert,
  message
} from 'antd';
import { 
  PlayCircleOutlined, 
  PlusOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PauseCircleOutlined,
  RocketOutlined,
  CalendarOutlined,
  TeamOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;

interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  assignee?: string;
  estimatedHours: number;
  actualHours?: number;
  dueDate: Date;
  dependencies: string[];
  week: number;
  day: number;
  phase: string;
  deliverables: string[];
  tools: string[];
  successCriteria: string[];
  resources: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  startDay: number;
  endDay: number;
  objectives: string[];
  tasks: WorkflowTask[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  totalDays: number;
  phases: WorkflowPhase[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowInstance {
  id: string;
  templateId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  progress: number;
  currentPhase: string;
  currentWeek: number;
  currentDay: number;
  tasks: WorkflowTask[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  blockedTasks: number;
  progress: number;
  estimatedHours: number;
  actualHours: number;
  efficiency: number;
}

const statusColors: { [key: string]: string } = {
  PENDING: 'default',
  IN_PROGRESS: 'processing',
  REVIEW: 'warning',
  COMPLETED: 'success',
  BLOCKED: 'error'
};

const priorityColors: { [key: string]: string } = {
  P0: '#f5222d',
  P1: '#fa541c',
  P2: '#fa8c16',
  P3: '#faad14',
  P4: '#1890ff',
  P5: '#8c8c8c'
};

const taskTypeIcons: { [key: string]: any } = {
  KEYWORD_RESEARCH: <BulbOutlined />,
  CONTENT_CREATION: <RocketOutlined />,
  REVIEW: <EyeOutlined />,
  PUBLICATION: <ThunderboltOutlined />,
  MONITORING: <BarChartOutlined />,
  OPTIMIZATION: <TrophyOutlined />
};

export default function WorkflowPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [activeTasks, setActiveTasks] = useState<WorkflowTask[]>([]);
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
    fetchInstances();
  }, []);

  useEffect(() => {
    if (selectedInstance) {
      fetchActiveTasks(selectedInstance.id);
      fetchWorkflowStats(selectedInstance.id);
    }
  }, [selectedInstance]);

  // 获取工作流模板
  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              workflowTemplates {
                id
                name
                description
                totalDays
                phases {
                  id
                  name
                  description
                  startDay
                  endDay
                  objectives
                }
                createdAt
                updatedAt
              }
            }
          `
        })
      });
      const data = await response.json();
      if (data.data?.workflowTemplates) {
        setTemplates(data.data.workflowTemplates);
      }
    } catch (error) {
      message.error('获取工作流模板失败');
    }
  };

  // 获取工作流实例
  const fetchInstances = async () => {
    try {
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              workflowInstances {
                id
                templateId
                name
                description
                startDate
                endDate
                status
                progress
                currentPhase
                currentWeek
                currentDay
                createdAt
                updatedAt
              }
            }
          `
        })
      });
      const data = await response.json();
      if (data.data?.workflowInstances) {
        setInstances(data.data.workflowInstances);
        if (data.data.workflowInstances.length > 0 && !selectedInstance) {
          setSelectedInstance(data.data.workflowInstances[0]);
        }
      }
    } catch (error) {
      message.error('获取工作流实例失败');
    }
  };

  // 获取活跃任务
  const fetchActiveTasks = async (instanceId: string) => {
    try {
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetActiveTasks($instanceId: String!) {
              activeTasks(instanceId: $instanceId) {
                id
                title
                description
                type
                priority
                status
                assignee
                estimatedHours
                actualHours
                dueDate
                week
                day
                phase
                deliverables
                tools
                successCriteria
                resources
              }
            }
          `,
          variables: { instanceId }
        })
      });
      const data = await response.json();
      if (data.data?.activeTasks) {
        setActiveTasks(data.data.activeTasks);
      }
    } catch (error) {
      message.error('获取活跃任务失败');
    }
  };

  // 获取工作流统计
  const fetchWorkflowStats = async (instanceId: string) => {
    try {
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetWorkflowStats($instanceId: String!) {
              workflowStats(instanceId: $instanceId) {
                totalTasks
                completedTasks
                inProgressTasks
                pendingTasks
                blockedTasks
                progress
                estimatedHours
                actualHours
                efficiency
              }
            }
          `,
          variables: { instanceId }
        })
      });
      const data = await response.json();
      if (data.data?.workflowStats) {
        setWorkflowStats(data.data.workflowStats);
      }
    } catch (error) {
      message.error('获取工作流统计失败');
    }
  };

  // 创建工作流实例
  const handleCreateInstance = async (values: any) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation CreateWorkflowInstance($input: CreateWorkflowInstanceInput!) {
              createWorkflowInstance(input: $input) {
                id
                name
                status
              }
            }
          `,
          variables: {
            input: {
              templateId: values.templateId,
              name: values.name,
              description: values.description,
              startDate: values.startDate.toISOString()
            }
          }
        })
      });
      
      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      message.success('工作流实例创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      fetchInstances();
    } catch (error: any) {
      message.error(error.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 启动工作流实例
  const handleStartInstance = async (instanceId: string) => {
    try {
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation StartWorkflowInstance($instanceId: String!) {
              startWorkflowInstance(instanceId: $instanceId) {
                id
                status
              }
            }
          `,
          variables: { instanceId }
        })
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      message.success('工作流已启动');
      fetchInstances();
    } catch (error: any) {
      message.error(error.message || '启动失败');
    }
  };

  // 更新任务状态
  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    if (!selectedInstance) return;

    try {
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation UpdateTaskStatus($input: UpdateTaskStatusInput!) {
              updateTaskStatus(input: $input) {
                id
                status
              }
            }
          `,
          variables: {
            input: {
              instanceId: selectedInstance.id,
              taskId,
              status
            }
          }
        })
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      message.success('任务状态已更新');
      fetchActiveTasks(selectedInstance.id);
      fetchWorkflowStats(selectedInstance.id);
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  // 查看任务详情
  const showTaskDetail = (task: WorkflowTask) => {
    setSelectedTask(task);
    setDetailDrawerVisible(true);
  };

  // 进度图表配置
  const getProgressChartOption = () => {
    if (!workflowStats) return {};
    
    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        top: '5%',
        left: 'center'
      },
      series: [
        {
          name: '任务分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          data: [
            { value: workflowStats.completedTasks, name: '已完成', itemStyle: { color: '#52c41a' } },
            { value: workflowStats.inProgressTasks, name: '进行中', itemStyle: { color: '#1890ff' } },
            { value: workflowStats.pendingTasks, name: '待开始', itemStyle: { color: '#d9d9d9' } },
            { value: workflowStats.blockedTasks, name: '已阻塞', itemStyle: { color: '#f5222d' } }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  };

  // 任务表格列定义
  const taskColumns = [
    {
      title: '任务',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: WorkflowTask) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Space size={4}>
            <Tag color={priorityColors[record.priority]}>{record.priority}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              第{record.week}周 第{record.day}天
            </Text>
          </Space>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Space>
          {taskTypeIcons[type]}
          <Text>{type.replace('_', ' ')}</Text>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {status.replace('_', ' ')}
        </Tag>
      )
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string) => dayjs(date).format('MM-DD')
    },
    {
      title: '预估/实际时间',
      key: 'hours',
      width: 130,
      render: (_: any, record: WorkflowTask) => (
        <Text>
          {record.estimatedHours}h / {record.actualHours || 0}h
        </Text>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: WorkflowTask) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => showTaskDetail(record)}
          >
            详情
          </Button>
          {record.status === 'PENDING' && (
            <Button 
              type="link" 
              icon={<PlayCircleOutlined />}
              onClick={() => handleUpdateTaskStatus(record.id, 'IN_PROGRESS')}
            >
              开始
            </Button>
          )}
          {record.status === 'IN_PROGRESS' && (
            <Button 
              type="link" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleUpdateTaskStatus(record.id, 'COMPLETED')}
            >
              完成
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 顶部统计卡片 */}
      {workflowStats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总体进度"
                value={workflowStats.progress}
                suffix="%"
                prefix={<RocketOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Progress 
                percent={workflowStats.progress} 
                size="small" 
                strokeColor="#1890ff"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已完成任务"
                value={workflowStats.completedTasks}
                suffix={`/ ${workflowStats.totalTasks}`}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="工作效率"
                value={workflowStats.efficiency}
                suffix="%"
                prefix={<ThunderboltOutlined />}
                valueStyle={{ 
                  color: workflowStats.efficiency >= 100 ? '#52c41a' : 
                         workflowStats.efficiency >= 80 ? '#faad14' : '#f5222d' 
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="实际/预估时间"
                value={workflowStats.actualHours}
                suffix={`/ ${workflowStats.estimatedHours}h`}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 主要内容区域 */}
      <Row gutter={[16, 16]}>
        {/* 左侧工作流实例 */}
        <Col span={8}>
          <Card
            title="工作流实例"
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                新建实例
              </Button>
            }
          >
            {instances.length === 0 ? (
              <Alert
                message="暂无工作流实例"
                description={"点击\"新建实例\"开始创建您的第一个30天工作流"}
                type="info"
                showIcon
              />
            ) : (
              <List
                dataSource={instances}
                renderItem={(instance) => (
                  <List.Item
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedInstance?.id === instance.id ? '#f0f0f0' : 'transparent'
                    }}
                    onClick={() => setSelectedInstance(instance)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge 
                          status={
                            instance.status === 'ACTIVE' ? 'processing' :
                            instance.status === 'COMPLETED' ? 'success' :
                            instance.status === 'PAUSED' ? 'warning' : 'default'
                          }
                        />
                      }
                      title={instance.name}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">{instance.description}</Text>
                          <Space>
                            <Text type="secondary">第{instance.currentWeek}周</Text>
                            <Progress 
                              percent={instance.progress} 
                              size="small" 
                              style={{ width: 100 }}
                            />
                          </Space>
                        </Space>
                      }
                    />
                    {instance.status === 'PLANNING' && (
                      <Button 
                        type="link" 
                        icon={<PlayCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartInstance(instance.id);
                        }}
                      >
                        启动
                      </Button>
                    )}
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* 右侧详情区域 */}
        <Col span={16}>
          {selectedInstance ? (
            <Tabs defaultActiveKey="tasks">
              <TabPane tab="当前任务" key="tasks">
                <Card title={`${selectedInstance.name} - 当前任务`}>
                  <Table
                    columns={taskColumns}
                    dataSource={activeTasks}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                </Card>
              </TabPane>
              
              <TabPane tab="进度分析" key="progress">
                <Card>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div style={{ height: 300 }}>
                        <ReactECharts 
                          option={getProgressChartOption()} 
                          style={{ height: '100%' }}
                        />
                      </div>
                    </Col>
                    <Col span={12}>
                      <Timeline mode="left">
                        <Timeline.Item 
                          color="green"
                          dot={<CheckCircleOutlined />}
                        >
                          <Text strong>第一周：基础建设期</Text>
                          <br />
                          <Text type="secondary">关键词分析、模板建设</Text>
                        </Timeline.Item>
                        <Timeline.Item 
                          color={selectedInstance.currentWeek >= 2 ? "green" : "gray"}
                          dot={selectedInstance.currentWeek >= 2 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                        >
                          <Text strong>第二周：加速推进期</Text>
                          <br />
                          <Text type="secondary">批量内容创作、多渠道分发</Text>
                        </Timeline.Item>
                        <Timeline.Item 
                          color={selectedInstance.currentWeek >= 3 ? "green" : "gray"}
                          dot={selectedInstance.currentWeek >= 3 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                        >
                          <Text strong>第三周：优化提升期</Text>
                          <br />
                          <Text type="secondary">数据驱动优化、A/B测试</Text>
                        </Timeline.Item>
                        <Timeline.Item 
                          color={selectedInstance.currentWeek >= 4 ? "green" : "gray"}
                          dot={selectedInstance.currentWeek >= 4 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                        >
                          <Text strong>第四周：规模化扩展期</Text>
                          <br />
                          <Text type="secondary">长尾覆盖、流程总结</Text>
                        </Timeline.Item>
                      </Timeline>
                    </Col>
                  </Row>
                </Card>
              </TabPane>
              
              <TabPane tab="工作流模板" key="template">
                <Card title="可用模板">
                  <List
                    dataSource={templates}
                    renderItem={(template) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                          title={template.name}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>{template.description}</Text>
                              <Space>
                                <Tag>{template.totalDays}天</Tag>
                                <Tag>{template.phases.length}个阶段</Tag>
                              </Space>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </TabPane>
            </Tabs>
          ) : (
            <Card>
              <Alert
                message="请选择工作流实例"
                description="从左侧列表中选择一个工作流实例以查看详细信息"
                type="info"
                showIcon
              />
            </Card>
          )}
        </Col>
      </Row>

      {/* 创建工作流实例模态框 */}
      <Modal
        title="创建工作流实例"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateInstance}
        >
          <Form.Item
            name="templateId"
            label="选择模板"
            rules={[{ required: true, message: '请选择工作流模板' }]}
          >
            <Select placeholder="选择工作流模板">
              {templates.map(template => (
                <Select.Option key={template.id} value={template.id}>
                  {template.name} ({template.totalDays}天)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="实例名称"
            rules={[{ required: true, message: '请输入实例名称' }]}
          >
            <Input placeholder="例如：Eufy Q4季度SEO推广" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea placeholder="描述这个工作流实例的目标和背景" rows={3} />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建实例
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务详情抽屉 */}
      <Drawer
        title="任务详情"
        placement="right"
        width={600}
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
      >
        {selectedTask && (
          <div>
            <Descriptions title={selectedTask.title} bordered column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="描述">
                {selectedTask.description}
              </Descriptions.Item>
              <Descriptions.Item label="任务类型">
                <Space>
                  {taskTypeIcons[selectedTask.type]}
                  {selectedTask.type.replace('_', ' ')}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={priorityColors[selectedTask.priority]}>
                  {selectedTask.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[selectedTask.status]}>
                  {selectedTask.status.replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="时间安排">
                第{selectedTask.week}周 第{selectedTask.day}天
              </Descriptions.Item>
              <Descriptions.Item label="预估时间">
                {selectedTask.estimatedHours} 小时
              </Descriptions.Item>
              {selectedTask.actualHours && (
                <Descriptions.Item label="实际时间">
                  {selectedTask.actualHours} 小时
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card title="交付物" size="small" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={selectedTask.deliverables}
                renderItem={item => (
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    {item}
                  </List.Item>
                )}
              />
            </Card>

            <Card title="使用工具" size="small" style={{ marginBottom: 16 }}>
              <Space wrap>
                {selectedTask.tools.map(tool => (
                  <Tag key={tool} color="blue">{tool}</Tag>
                ))}
              </Space>
            </Card>

            <Card title="成功标准" size="small" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={selectedTask.successCriteria}
                renderItem={item => (
                  <List.Item>
                    <TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    {item}
                  </List.Item>
                )}
              />
            </Card>

            <Card title="资源需求" size="small">
              <Space wrap>
                {selectedTask.resources.map(resource => (
                  <Tag key={resource} color="green" icon={<TeamOutlined />}>
                    {resource}
                  </Tag>
                ))}
              </Space>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}