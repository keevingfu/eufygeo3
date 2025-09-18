'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Progress,
  List,
  Tag,
  Timeline,
  Avatar,
  Button
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  TrendingUpOutlined,
  TeamOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import ReactECharts from 'echarts-for-react';

const { Title, Text, Paragraph } = Typography;

interface QuickAction {
  title: string;
  icon: React.ReactNode;
  description: string;
  path: string;
  color: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 快捷操作
  const quickActions: QuickAction[] = [
    {
      title: '添加关键词',
      icon: <SearchOutlined style={{ fontSize: 24 }} />,
      description: '添加新的 SEO 关键词',
      path: '/dashboard/keywords',
      color: '#1890ff'
    },
    {
      title: 'AI 生成内容',
      icon: <RocketOutlined style={{ fontSize: 24 }} />,
      description: '使用 AI 创建优质内容',
      path: '/dashboard/content',
      color: '#52c41a'
    },
    {
      title: '查看分析',
      icon: <TrendingUpOutlined style={{ fontSize: 24 }} />,
      description: '查看数据分析报告',
      path: '/dashboard/analytics',
      color: '#fa541c'
    },
    {
      title: '导出报告',
      icon: <FileTextOutlined style={{ fontSize: 24 }} />,
      description: '导出 SEO 分析报告',
      path: '/dashboard/export',
      color: '#722ed1'
    }
  ];

  // 最近活动
  const recentActivities = [
    { time: '10分钟前', action: '生成了内容', detail: '"Eufy 安防摄像头完整指南"', type: 'success' },
    { time: '30分钟前', action: '添加了关键词', detail: '"eufy smart home"', type: 'info' },
    { time: '1小时前', action: '完成了任务', detail: '"优化首页SEO"', type: 'success' },
    { time: '2小时前', action: '导出了报告', detail: '月度SEO分析报告', type: 'warning' },
    { time: '3小时前', action: '更新了内容', detail: '"产品对比文章"', type: 'info' }
  ];

  // 性能概览图表
  const getPerformanceChart = () => {
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['搜索量', '点击率', '转化率']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '搜索量',
          type: 'line',
          smooth: true,
          data: [12000, 13200, 10100, 13400, 9000, 23000, 21000]
        },
        {
          name: '点击率',
          type: 'line',
          smooth: true,
          data: [2200, 1820, 1910, 2340, 2900, 3300, 3100]
        },
        {
          name: '转化率',
          type: 'line',
          smooth: true,
          data: [150, 232, 201, 154, 190, 330, 410]
        }
      ]
    };
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>仪表板</Title>
        <Paragraph type="secondary">
          欢迎使用 Eufy GEO Platform，您的 AI 驱动 SEO 管理平台
        </Paragraph>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总关键词"
              value={1250}
              prefix={<SearchOutlined />}
              suffix={
                <Text type="success" style={{ fontSize: 14 }}>
                  +12%
                </Text>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="生成内容"
              value={486}
              prefix={<FileTextOutlined />}
              suffix={
                <Text type="success" style={{ fontSize: 14 }}>
                  +23%
                </Text>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均 SEO 评分"
              value={78.5}
              prefix={<ThunderboltOutlined />}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="团队成员"
              value={4}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Card title="快捷操作" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col span={6} key={index}>
              <Card
                hoverable
                onClick={() => router.push(action.path)}
                style={{ textAlign: 'center' }}
              >
                <div style={{ color: action.color, marginBottom: 16 }}>
                  {action.icon}
                </div>
                <Title level={5} style={{ marginBottom: 8 }}>
                  {action.title}
                </Title>
                <Text type="secondary">{action.description}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 性能趋势 */}
        <Col span={16}>
          <Card title="本周性能趋势">
            <ReactECharts 
              option={getPerformanceChart()} 
              style={{ height: 300 }}
            />
          </Card>
        </Col>

        {/* 最近活动 */}
        <Col span={8}>
          <Card 
            title="最近活动" 
            extra={<Button type="link">查看全部</Button>}
          >
            <Timeline>
              {recentActivities.map((activity, index) => (
                <Timeline.Item
                  key={index}
                  color={
                    activity.type === 'success' ? 'green' :
                    activity.type === 'warning' ? 'orange' :
                    'blue'
                  }
                >
                  <Space direction="vertical" size={0}>
                    <Space>
                      <Text type="secondary">{activity.time}</Text>
                      <Text>{activity.action}</Text>
                    </Space>
                    <Text strong>{activity.detail}</Text>
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* 任务概览 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="任务进度">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text>关键词优化</Text>
                <Progress percent={75} />
              </div>
              <div>
                <Text>内容创建</Text>
                <Progress percent={60} status="active" />
              </div>
              <div>
                <Text>竞品分析</Text>
                <Progress percent={85} />
              </div>
              <div>
                <Text>报告生成</Text>
                <Progress percent={45} status="exception" />
              </div>
            </Space>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="待办事项">
            <List
              dataSource={[
                { title: '审核 AI 生成的10篇文章', priority: 'high', due: '今天' },
                { title: '优化 "eufy security" 关键词', priority: 'medium', due: '明天' },
                { title: '完成月度 SEO 报告', priority: 'high', due: '本周五' },
                { title: '更新产品描述页面', priority: 'low', due: '下周' }
              ]}
              renderItem={item => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <CheckCircleOutlined />
                      <Text>{item.title}</Text>
                    </Space>
                    <Space>
                      <Tag color={
                        item.priority === 'high' ? 'red' :
                        item.priority === 'medium' ? 'orange' :
                        'green'
                      }>
                        {item.priority === 'high' ? '高' :
                         item.priority === 'medium' ? '中' : '低'}
                      </Tag>
                      <Text type="secondary">{item.due}</Text>
                    </Space>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}