'use client';

import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Input,
  Button,
  Form,
  Space,
  Alert,
  Tag,
  List,
  Typography,
  Row,
  Col,
  Timeline,
  Divider,
  Switch,
  Select,
  message,
  Tooltip
} from 'antd';
import {
  GoogleOutlined,
  YoutubeOutlined,
  RedditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  WarningOutlined,
  CopyOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface OptimizationResult {
  channel: string;
  title?: string;
  description?: string;
  tags?: string[];
  recommendations?: string[];
  bestPostTime?: string;
}

export default function ChannelManagementPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<{
    [key: string]: OptimizationResult;
  }>({});

  // 优化内容
  const handleOptimize = async (channel: string) => {
    try {
      const values = await form.validateFields();
      
      setLoading(true);
      const response = await fetch('http://localhost:4006/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query OptimizeForChannel($content: ContentInput!, $channel: String!) {
              optimizeForChannel(content: $content, channel: $channel) {
                channel
                title
                description
                tags
                recommendations
                bestPostTime
              }
            }
          `,
          variables: {
            content: {
              title: values.title,
              description: values.description,
              keyword: values.keyword,
              type: values.contentType,
              tags: values.tags?.split(',').map((t: string) => t.trim()) || []
            },
            channel
          }
        })
      });

      const data = await response.json();
      if (data.data?.optimizeForChannel) {
        setOptimizationResults({
          ...optimizationResults,
          [channel]: data.data.optimizeForChannel
        });
        message.success(`${channel} 优化完成！`);
      }
    } catch (error) {
      message.error('优化失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 复制优化结果
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${type}已复制`);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>渠道管理系统</Title>
        <Paragraph type="secondary">
          为 Google、YouTube 和 Reddit 等平台优化内容，提高曝光率和参与度
        </Paragraph>
      </div>

      <Row gutter={24}>
        <Col span={10}>
          <Card title="内容信息">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                contentType: 'blog'
              }}
            >
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="输入内容标题" />
              </Form.Item>

              <Form.Item
                name="keyword"
                label="主要关键词"
                rules={[{ required: true, message: '请输入关键词' }]}
              >
                <Input placeholder="输入目标关键词" />
              </Form.Item>

              <Form.Item
                name="description"
                label="描述"
                rules={[{ required: true, message: '请输入描述' }]}
              >
                <TextArea
                  placeholder="输入内容描述"
                  rows={4}
                />
              </Form.Item>

              <Form.Item
                name="contentType"
                label="内容类型"
              >
                <Select>
                  <Select.Option value="blog">博客文章</Select.Option>
                  <Select.Option value="video">视频内容</Select.Option>
                  <Select.Option value="product">产品介绍</Select.Option>
                  <Select.Option value="guide">操作指南</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="tags"
                label="标签（逗号分隔）"
              >
                <Input placeholder="如: smart home, security camera, eufy" />
              </Form.Item>
            </Form>

            <Space style={{ width: '100%', marginTop: 16 }}>
              <Button
                type="primary"
                icon={<GoogleOutlined />}
                loading={loading}
                onClick={() => handleOptimize('google')}
              >
                Google 优化
              </Button>
              <Button
                type="primary"
                danger
                icon={<YoutubeOutlined />}
                loading={loading}
                onClick={() => handleOptimize('youtube')}
              >
                YouTube 优化
              </Button>
              <Button
                type="primary"
                icon={<RedditOutlined />}
                loading={loading}
                onClick={() => handleOptimize('reddit')}
                style={{ backgroundColor: '#FF4500', borderColor: '#FF4500' }}
              >
                Reddit 优化
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={14}>
          <Tabs defaultActiveKey="google">
            <TabPane
              tab={<span><GoogleOutlined /> Google Search</span>}
              key="google"
            >
              {optimizationResults.google ? (
                <Card>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                      <Text strong>优化后的标题</Text>
                      <Alert
                        message={optimizationResults.google.title}
                        type="success"
                        showIcon
                        action={
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(optimizationResults.google.title!, '标题')}
                          >
                            复制
                          </Button>
                        }
                        style={{ marginTop: 8 }}
                      />
                    </div>

                    <div>
                      <Text strong>优化后的元描述</Text>
                      <Alert
                        message={optimizationResults.google.description}
                        type="info"
                        showIcon
                        action={
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(optimizationResults.google.description!, '描述')}
                          >
                            复制
                          </Button>
                        }
                        style={{ marginTop: 8 }}
                      />
                    </div>

                    <div>
                      <Text strong>优化建议</Text>
                      <List
                        style={{ marginTop: 8 }}
                        dataSource={optimizationResults.google.recommendations}
                        renderItem={(item) => (
                          <List.Item>
                            <Space>
                              <BulbOutlined style={{ color: '#faad14' }} />
                              <Text>{item}</Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </div>

                    <Divider />

                    <Alert
                      message="Google SEO 最佳实践"
                      description={
                        <ul style={{ paddingLeft: 20 }}>
                          <li>标题长度控制在 50-60 字符</li>
                          <li>元描述长度控制在 150-160 字符</li>
                          <li>在标题和描述中自然地包含关键词</li>
                          <li>使用结构化数据增强搜索结果</li>
                          <li>确保页面加载速度快（Core Web Vitals）</li>
                        </ul>
                      }
                      type="info"
                      showIcon
                    />
                  </Space>
                </Card>
              ) : (
                <Alert
                  message="点击"Google 优化"按钮开始优化"
                  type="info"
                  showIcon
                />
              )}
            </TabPane>

            <TabPane
              tab={<span><YoutubeOutlined /> YouTube</span>}
              key="youtube"
            >
              {optimizationResults.youtube ? (
                <Card>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                      <Text strong>优化后的标题</Text>
                      <Alert
                        message={optimizationResults.youtube.title}
                        type="success"
                        showIcon
                        style={{ marginTop: 8 }}
                      />
                    </div>

                    <div>
                      <Text strong>建议标签</Text>
                      <div style={{ marginTop: 8 }}>
                        {optimizationResults.youtube.tags?.map((tag, index) => (
                          <Tag
                            key={index}
                            color="red"
                            style={{ marginBottom: 8, cursor: 'pointer' }}
                            onClick={() => copyToClipboard(tag, '标签')}
                          >
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    </div>

                    <Timeline>
                      <Timeline.Item color="green">
                        添加引人注目的缩略图
                      </Timeline.Item>
                      <Timeline.Item color="green">
                        在前 15 秒内吸引观众
                      </Timeline.Item>
                      <Timeline.Item color="green">
                        添加时间戳和章节
                      </Timeline.Item>
                      <Timeline.Item color="green">
                        鼓励观众订阅和点赞
                      </Timeline.Item>
                    </Timeline>

                    <Alert
                      message="YouTube 优化提示"
                      description="视频标题要吸引人，使用表情符号，包含年份（如 2024），并在描述的前 125 个字符中包含关键信息。"
                      type="warning"
                      showIcon
                    />
                  </Space>
                </Card>
              ) : (
                <Alert
                  message="点击"YouTube 优化"按钮开始优化"
                  type="info"
                  showIcon
                />
              )}
            </TabPane>

            <TabPane
              tab={<span><RedditOutlined /> Reddit</span>}
              key="reddit"
            >
              {optimizationResults.reddit ? (
                <Card>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Alert
                      message={`最佳发布时间: ${optimizationResults.reddit.bestPostTime}`}
                      type="success"
                      icon={<ClockCircleOutlined />}
                      showIcon
                    />

                    <div>
                      <Text strong>Reddit 参与度建议</Text>
                      <List
                        style={{ marginTop: 8 }}
                        dataSource={optimizationResults.reddit.recommendations}
                        renderItem={(item) => (
                          <List.Item>
                            <Space>
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                              <Text>{item}</Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </div>

                    <Alert
                      message="Reddit 社区规则"
                      description={
                        <div>
                          <p><WarningOutlined /> 遵守每个子版块的具体规则</p>
                          <p><ThunderboltOutlined /> 提供价值，避免过度自我推广</p>
                          <p><BulbOutlined /> 使用合适的 flair 标签</p>
                          <p><CheckCircleOutlined /> 积极参与讨论，回复评论</p>
                        </div>
                      }
                      type="warning"
                      showIcon
                    />

                    <Card size="small" title="Reddit 格式建议">
                      <pre style={{ fontSize: 12 }}>
{`# 标题（简洁有力）

## TL;DR
简短总结（2-3句话）

## 详细内容
- 要点 1
- 要点 2
- 要点 3

## 个人经验
分享真实的使用体验...

## 讨论问题
你们有什么看法？`}
                      </pre>
                    </Card>
                  </Space>
                </Card>
              ) : (
                <Alert
                  message="点击"Reddit 优化"按钮开始优化"
                  type="info"
                  showIcon
                />
              )}
            </TabPane>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
}