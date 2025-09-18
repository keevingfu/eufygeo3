'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  List,
  Typography,
  Tag,
  Button,
  Space,
  Timeline,
  Progress,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Divider,
  Badge,
  Tabs
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  CalendarOutlined,
  MessageOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  tasksCompleted: number;
  tasksAssigned: number;
  lastActive?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee?: TeamMember;
  dueDate?: string;
  tags: string[];
}

interface Activity {
  id: string;
  type: string;
  description: string;
  user: TeamMember;
  createdAt: string;
}

const priorityColors: { [key: string]: string } = {
  URGENT: 'red',
  HIGH: 'orange',
  MEDIUM: 'blue',
  LOW: 'green'
};

const statusColors: { [key: string]: string } = {
  TODO: 'default',
  IN_PROGRESS: 'processing',
  IN_REVIEW: 'warning',
  COMPLETED: 'success'
};

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [form] = Form.useForm();
  const [inviteForm] = Form.useForm();
  const router = useRouter();

  // 加载模拟数据
  useEffect(() => {
    // 模拟团队成员
    setTeamMembers([
      { id: '1', name: '张伟', email: 'admin@eufy.com', role: 'ADMIN', avatar: '👤', tasksCompleted: 15, tasksAssigned: 18, lastActive: '2分钟前' },
      { id: '2', name: '李娜', email: 'editor1@eufy.com', role: 'EDITOR', avatar: '👩', tasksCompleted: 12, tasksAssigned: 15, lastActive: '1小时前' },
      { id: '3', name: '王刚', email: 'editor2@eufy.com', role: 'EDITOR', avatar: '👨', tasksCompleted: 8, tasksAssigned: 10, lastActive: '3小时前' },
      { id: '4', name: '陈静', email: 'reviewer@eufy.com', role: 'REVIEWER', avatar: '👩‍💼', tasksCompleted: 20, tasksAssigned: 22, lastActive: '刚刚' }
    ]);

    // 模拟任务
    setTasks([
      { 
        id: '1', 
        title: '优化首页关键词密度', 
        description: '调整首页内容，提高核心关键词密度到2-3%',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignee: { id: '2', name: '李娜', email: '', role: 'EDITOR', avatar: '👩', tasksCompleted: 0, tasksAssigned: 0 },
        dueDate: '2025-09-20',
        tags: ['SEO', '优化']
      },
      { 
        id: '2', 
        title: '编写产品对比文章', 
        description: '创建Eufy vs Arlo详细对比文章',
        status: 'TODO',
        priority: 'URGENT',
        assignee: { id: '3', name: '王刚', email: '', role: 'EDITOR', avatar: '👨', tasksCompleted: 0, tasksAssigned: 0 },
        dueDate: '2025-09-18',
        tags: ['内容', '竞品分析']
      },
      { 
        id: '3', 
        title: '审核批量生成内容', 
        description: '审核AI生成的10篇博客文章',
        status: 'IN_REVIEW',
        priority: 'MEDIUM',
        assignee: { id: '4', name: '陈静', email: '', role: 'REVIEWER', avatar: '👩‍💼', tasksCompleted: 0, tasksAssigned: 0 },
        tags: ['审核', 'AI内容']
      }
    ]);

    // 模拟活动时间线
    setActivities([
      { id: '1', type: 'TASK_COMPLETED', description: '完成了任务 "更新产品描述"', user: { id: '2', name: '李娜', email: '', role: 'EDITOR', avatar: '👩', tasksCompleted: 0, tasksAssigned: 0 }, createdAt: '10分钟前' },
      { id: '2', type: 'CONTENT_CREATED', description: '创建了新内容 "智能家居安全指南"', user: { id: '3', name: '王刚', email: '', role: 'EDITOR', avatar: '👨', tasksCompleted: 0, tasksAssigned: 0 }, createdAt: '30分钟前' },
      { id: '3', type: 'TASK_ASSIGNED', description: '分配了任务 "审核批量生成内容" 给陈静', user: { id: '1', name: '张伟', email: '', role: 'ADMIN', avatar: '👤', tasksCompleted: 0, tasksAssigned: 0 }, createdAt: '1小时前' },
      { id: '4', type: 'COMMENT_ADDED', description: '在任务 "优化关键词" 中添加了评论', user: { id: '4', name: '陈静', email: '', role: 'REVIEWER', avatar: '👩‍💼', tasksCompleted: 0, tasksAssigned: 0 }, createdAt: '2小时前' }
    ]);
  }, []);

  // 创建任务
  const handleCreateTask = (values: any) => {
    message.success('任务创建成功！');
    setTaskModalVisible(false);
    form.resetFields();
  };

  // 邀请成员
  const handleInviteMember = (values: any) => {
    message.success(`已向 ${values.email} 发送邀请！`);
    setInviteModalVisible(false);
    inviteForm.resetFields();
  };

  // 团队统计数据
  const teamStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
    inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completionRate: Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100)
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>团队协作中心</Title>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setTaskModalVisible(true)}>
            创建任务
          </Button>
          <Button type="primary" icon={<UserOutlined />} onClick={() => setInviteModalVisible(true)}>
            邀请成员
          </Button>
        </Space>
      </div>

      <Tabs activeKey={selectedTab} onChange={setSelectedTab}>
        <TabPane tab="概览" key="overview">
          {/* 统计卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="团队成员"
                  value={teamMembers.length}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总任务数"
                  value={teamStats.totalTasks}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="进行中"
                  value={teamStats.inProgressTasks}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="完成率"
                  value={teamStats.completionRate}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* 团队成员 */}
            <Col span={8}>
              <Card title={<Space><TeamOutlined />团队成员</Space>}>
                <List
                  dataSource={teamMembers}
                  renderItem={member => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar size={40}>{member.avatar}</Avatar>}
                        title={
                          <Space>
                            <Text>{member.name}</Text>
                            <Tag color={member.role === 'ADMIN' ? 'red' : member.role === 'REVIEWER' ? 'blue' : 'green'}>
                              {member.role}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary" style={{ fontSize: 12 }}>{member.email}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              活跃: {member.lastActive} | 完成: {member.tasksCompleted}/{member.tasksAssigned}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* 最新活动 */}
            <Col span={8}>
              <Card title={<Space><ClockCircleOutlined />最新活动</Space>}>
                <Timeline>
                  {activities.map(activity => (
                    <Timeline.Item key={activity.id}>
                      <Space direction="vertical" size={0}>
                        <Space>
                          <Avatar size="small">{activity.user.avatar}</Avatar>
                          <Text strong>{activity.user.name}</Text>
                        </Space>
                        <Text>{activity.description}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{activity.createdAt}</Text>
                      </Space>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            </Col>

            {/* 任务概览 */}
            <Col span={8}>
              <Card title={<Space><CalendarOutlined />任务列表</Space>}>
                <List
                  dataSource={tasks}
                  renderItem={task => (
                    <List.Item>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Text strong>{task.title}</Text>
                          <Badge status={statusColors[task.status] as any} text={task.status} />
                        </Space>
                        <Space>
                          <Tag color={priorityColors[task.priority]}>{task.priority}</Tag>
                          {task.assignee && (
                            <Space>
                              <Avatar size="small">{task.assignee.avatar}</Avatar>
                              <Text style={{ fontSize: 12 }}>{task.assignee.name}</Text>
                            </Space>
                          )}
                          {task.dueDate && <Text type="secondary" style={{ fontSize: 12 }}>截止: {task.dueDate}</Text>}
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="任务管理" key="tasks">
          <Card>
            <List
              dataSource={tasks}
              renderItem={task => (
                <List.Item
                  actions={[
                    <Button key="edit" type="link">编辑</Button>,
                    <Button key="comment" type="link" icon={<MessageOutlined />}>评论</Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{task.title}</Text>
                        <Tag color={priorityColors[task.priority]}>{task.priority}</Tag>
                        <Tag color={statusColors[task.status]}>{task.status}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical">
                        <Text>{task.description}</Text>
                        <Space>
                          {task.assignee && (
                            <>
                              <Avatar size="small">{task.assignee.avatar}</Avatar>
                              <Text>{task.assignee.name}</Text>
                            </>
                          )}
                          {task.dueDate && <Text type="secondary">截止: {task.dueDate}</Text>}
                          {task.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane tab="团队表现" key="performance">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="表现排行榜">
                <List
                  dataSource={teamMembers.sort((a, b) => b.tasksCompleted - a.tasksCompleted)}
                  renderItem={(member, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          index === 0 ? (
                            <Badge count={<TrophyOutlined style={{ color: '#faad14' }} />}>
                              <Avatar size={40}>{member.avatar}</Avatar>
                            </Badge>
                          ) : (
                            <Avatar size={40}>{member.avatar}</Avatar>
                          )
                        }
                        title={<Text strong>{member.name}</Text>}
                        description={
                          <Space direction="vertical">
                            <Progress 
                              percent={Math.round((member.tasksCompleted / member.tasksAssigned) * 100)} 
                              size="small"
                            />
                            <Text type="secondary">完成 {member.tasksCompleted} / {member.tasksAssigned} 项任务</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* 创建任务模态框 */}
      <Modal
        title="创建新任务"
        open={taskModalVisible}
        onCancel={() => setTaskModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTask}
        >
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="例如：优化产品页面SEO" />
          </Form.Item>

          <Form.Item
            name="description"
            label="任务描述"
            rules={[{ required: true, message: '请输入任务描述' }]}
          >
            <TextArea rows={4} placeholder="详细描述任务内容和要求" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true }]}
              >
                <Select placeholder="选择优先级">
                  <Option value="URGENT">紧急</Option>
                  <Option value="HIGH">高</Option>
                  <Option value="MEDIUM">中</Option>
                  <Option value="LOW">低</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="assigneeId"
                label="负责人"
              >
                <Select placeholder="选择负责人">
                  {teamMembers.map(member => (
                    <Option key={member.id} value={member.id}>{member.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dueDate"
            label="截止日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select mode="tags" placeholder="添加标签">
              <Option value="SEO">SEO</Option>
              <Option value="内容">内容</Option>
              <Option value="优化">优化</Option>
              <Option value="审核">审核</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建任务
              </Button>
              <Button onClick={() => setTaskModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 邀请成员模态框 */}
      <Modal
        title="邀请新成员"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={null}
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleInviteMember}
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="member@eufy.com" />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="张三" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择角色">
              <Option value="ADMIN">管理员</Option>
              <Option value="EDITOR">编辑</Option>
              <Option value="REVIEWER">审核员</Option>
              <Option value="VIEWER">查看者</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                发送邀请
              </Button>
              <Button onClick={() => setInviteModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}