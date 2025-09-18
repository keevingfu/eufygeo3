'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  message,
  Typography,
  Drawer,
  List,
  Statistic,
  Row,
  Col,
  Progress,
  Alert,
  Tabs,
  Divider,
  Badge
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  BarChartOutlined,
  BulbOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface ContentItem {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  tone: string;
  keywords: string[];
  wordCount: number;
  seoScore: number;
  createdAt: string;
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface ContentAnalysis {
  readabilityScore: number;
  seoScore: number;
  suggestions: string[];
  missingKeywords: string[];
  estimatedReadTime: number;
}

const contentTypeConfig: { [key: string]: { color: string; icon: React.ReactNode } } = {
  BLOG_POST: { color: 'blue', icon: <FileTextOutlined /> },
  PRODUCT_DESCRIPTION: { color: 'green', icon: <BulbOutlined /> },
  FAQ: { color: 'orange', icon: <ThunderboltOutlined /> },
  SOCIAL_MEDIA: { color: 'purple', icon: <RobotOutlined /> },
  EMAIL: { color: 'cyan', icon: <EditOutlined /> },
  LANDING_PAGE: { color: 'magenta', icon: <BarChartOutlined /> }
};

const statusConfig: { [key: string]: string } = {
  DRAFT: 'default',
  IN_REVIEW: 'processing',
  APPROVED: 'success',
  PUBLISHED: 'success'
};

export default function ContentPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [contentDrawerVisible, setContentDrawerVisible] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const router = useRouter();

  // 获取内容列表
  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              contents {
                id
                title
                content
                type
                status
                tone
                keywords
                wordCount
                seoScore
                createdAt
              }
            }
          `,
        }),
      });

      const data = await response.json();
      if (data.data && data.data.contents) {
        setContents(data.data.contents);
      }
    } catch (error) {
      message.error('获取内容列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取模板列表
  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              templates {
                id
                name
                description
                type
              }
            }
          `,
        }),
      });

      const data = await response.json();
      if (data.data && data.data.templates) {
        setTemplates(data.data.templates);
      }
    } catch (error) {
      message.error('获取模板列表失败');
    }
  };

  useEffect(() => {
    fetchContents();
    fetchTemplates();
  }, []);

  // 生成内容
  const handleGenerateContent = async (values: any) => {
    try {
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation GenerateContent($input: GenerateContentInput!) {
              generateContent(input: $input) {
                id
                title
                content
                type
                status
                wordCount
                seoScore
              }
            }
          `,
          variables: {
            input: {
              keywords: values.keywords.split(',').map((k: string) => k.trim()),
              type: values.type,
              tone: values.tone,
              templateId: values.templateId,
              targetWordCount: values.targetWordCount
            }
          }
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      message.success('内容生成成功！');
      setGenerateModalVisible(false);
      form.resetFields();
      fetchContents();
    } catch (error: any) {
      message.error(error.message || '生成失败');
    }
  };

  // 批量生成
  const handleBatchGenerate = async (values: any) => {
    try {
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation BatchGenerate($input: BatchGenerateInput!) {
              batchGenerateContent(input: $input) {
                success
                items {
                  id
                  title
                }
                message
              }
            }
          `,
          variables: {
            input: {
              keywordGroups: values.keywordGroups.split('\\n').filter((g: string) => g.trim()),
              type: values.type,
              tone: values.tone,
              templateId: values.templateId,
              batchSize: values.batchSize
            }
          }
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      const result = data.data.batchGenerateContent;
      if (result.success) {
        message.success(result.message);
        setBatchModalVisible(false);
        batchForm.resetFields();
        fetchContents();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      message.error(error.message || '批量生成失败');
    }
  };

  // 查看内容详情
  const handleViewContent = async (content: ContentItem) => {
    setSelectedContent(content);
    setContentDrawerVisible(true);

    // 获取内容分析
    try {
      const response = await fetch('http://localhost:4005/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query AnalyzeContent($contentId: String!) {
              analyzeContent(contentId: $contentId) {
                readabilityScore
                seoScore
                suggestions
                missingKeywords
                estimatedReadTime
              }
            }
          `,
          variables: { contentId: content.id }
        }),
      });

      const data = await response.json();
      if (data.data && data.data.analyzeContent) {
        setContentAnalysis(data.data.analyzeContent);
      }
    } catch (error) {
      console.error('获取内容分析失败:', error);
    }
  };

  // 复制内容
  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('内容已复制到剪贴板！');
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (title: string, record: ContentItem) => (
        <Space>
          {contentTypeConfig[record.type]?.icon}
          <Text style={{ cursor: 'pointer' }} onClick={() => handleViewContent(record)}>
            {title}
          </Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => (
        <Tag color={contentTypeConfig[type]?.color || 'default'}>
          {type.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusConfig[status] || 'default'}>
          {status.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: '字数',
      dataIndex: 'wordCount',
      key: 'wordCount',
      width: 100,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: 'SEO评分',
      dataIndex: 'seoScore',
      key: 'seoScore',
      width: 120,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      width: 200,
      render: (keywords: string[]) => (
        <Space size={[0, 8]} wrap>
          {keywords.slice(0, 3).map((keyword, index) => (
            <Tag key={index}>{keyword}</Tag>
          ))}
          {keywords.length > 3 && <Tag>+{keywords.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: ContentItem) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewContent(record)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            icon={<CopyOutlined />} 
            onClick={() => handleCopyContent(record.content)}
          >
            复制
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总内容数"
              value={contents.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均SEO评分"
              value={contents.length > 0 
                ? Math.round(contents.reduce((sum, c) => sum + c.seoScore, 0) / contents.length)
                : 0
              }
              suffix="分"
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总字数"
              value={contents.reduce((sum, c) => sum + c.wordCount, 0)}
              prefix={<EditOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="可用模板"
              value={templates.length}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Title level={3} style={{ margin: 0 }}>AI 内容管理</Title>
          <Space>
            <Button 
              type="primary" 
              icon={<RobotOutlined />}
              onClick={() => setGenerateModalVisible(true)}
            >
              AI 生成内容
            </Button>
            <Button 
              icon={<ThunderboltOutlined />}
              onClick={() => setBatchModalVisible(true)}
            >
              批量生成
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={contents}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* AI 生成内容模态框 */}
      <Modal
        title="AI 生成内容"
        open={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateContent}
          initialValues={{
            type: 'BLOG_POST',
            tone: 'PROFESSIONAL',
            targetWordCount: 500
          }}
        >
          <Form.Item
            name="keywords"
            label="关键词（用逗号分隔）"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Input placeholder="例如: eufy security camera, 智能监控, 家庭安全" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="内容类型"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="BLOG_POST">博客文章</Option>
                  <Option value="PRODUCT_DESCRIPTION">产品描述</Option>
                  <Option value="FAQ">常见问题</Option>
                  <Option value="SOCIAL_MEDIA">社交媒体</Option>
                  <Option value="EMAIL">营销邮件</Option>
                  <Option value="LANDING_PAGE">落地页</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tone"
                label="语气风格"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="PROFESSIONAL">专业正式</Option>
                  <Option value="CASUAL">轻松随意</Option>
                  <Option value="FRIENDLY">友好亲切</Option>
                  <Option value="TECHNICAL">技术专业</Option>
                  <Option value="PERSUASIVE">说服力强</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="templateId"
            label="使用模板（可选）"
          >
            <Select placeholder="选择模板" allowClear>
              {templates.map(template => (
                <Option key={template.id} value={template.id}>
                  {template.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="targetWordCount"
            label="目标字数"
          >
            <InputNumber min={100} max={5000} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<RobotOutlined />}>
                生成内容
              </Button>
              <Button onClick={() => setGenerateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量生成模态框 */}
      <Modal
        title="批量生成内容"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="批量生成提示"
          description="每行输入一组关键词，用逗号分隔。最多支持10组。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchGenerate}
          initialValues={{
            type: 'BLOG_POST',
            tone: 'PROFESSIONAL',
            batchSize: 5
          }}
        >
          <Form.Item
            name="keywordGroups"
            label="关键词组（每行一组）"
            rules={[{ required: true, message: '请输入关键词组' }]}
          >
            <TextArea
              rows={5}
              placeholder={`eufy security camera, 智能监控
eufy robot vacuum, 扫地机器人
eufy doorbell, 智能门铃`}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="内容类型">
                <Select>
                  <Option value="BLOG_POST">博客文章</Option>
                  <Option value="PRODUCT_DESCRIPTION">产品描述</Option>
                  <Option value="SOCIAL_MEDIA">社交媒体</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tone" label="语气风格">
                <Select>
                  <Option value="PROFESSIONAL">专业正式</Option>
                  <Option value="CASUAL">轻松随意</Option>
                  <Option value="PERSUASIVE">说服力强</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="batchSize" label="批次大小">
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<ThunderboltOutlined />}>
                批量生成
              </Button>
              <Button onClick={() => setBatchModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 内容详情抽屉 */}
      <Drawer
        title={selectedContent?.title}
        placement="right"
        onClose={() => setContentDrawerVisible(false)}
        open={contentDrawerVisible}
        width={800}
      >
        {selectedContent && (
          <div>
            <Tabs defaultActiveKey="content">
              <TabPane tab="内容预览" key="content">
                <Card>
                  <Paragraph>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {selectedContent.content}
                    </pre>
                  </Paragraph>
                  <Divider />
                  <Space>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyContent(selectedContent.content)}
                    >
                      复制内容
                    </Button>
                  </Space>
                </Card>
              </TabPane>

              <TabPane tab="内容分析" key="analysis">
                {contentAnalysis ? (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Card>
                          <Statistic
                            title="可读性评分"
                            value={contentAnalysis.readabilityScore}
                            suffix="/ 100"
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card>
                          <Statistic
                            title="预计阅读时间"
                            value={contentAnalysis.estimatedReadTime}
                            suffix="分钟"
                          />
                        </Card>
                      </Col>
                    </Row>

                    {contentAnalysis.suggestions.length > 0 && (
                      <Card title="改进建议" style={{ marginTop: 16 }}>
                        <List
                          dataSource={contentAnalysis.suggestions}
                          renderItem={item => (
                            <List.Item>
                              <BulbOutlined style={{ marginRight: 8, color: '#faad14' }} />
                              {item}
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}

                    {contentAnalysis.missingKeywords.length > 0 && (
                      <Alert
                        message="缺失的关键词"
                        description={contentAnalysis.missingKeywords.join(', ')}
                        type="warning"
                        showIcon
                        style={{ marginTop: 16 }}
                      />
                    )}
                  </div>
                ) : (
                  <Card loading={true} />
                )}
              </TabPane>

              <TabPane tab="元信息" key="meta">
                <Card>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>类型: </Text>
                      <Tag color={contentTypeConfig[selectedContent.type]?.color}>
                        {selectedContent.type}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>语气: </Text>
                      <Tag>{selectedContent.tone}</Tag>
                    </div>
                    <div>
                      <Text strong>状态: </Text>
                      <Tag color={statusConfig[selectedContent.status]}>
                        {selectedContent.status}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>字数: </Text>
                      <Badge count={selectedContent.wordCount} showZero color="#52c41a" />
                    </div>
                    <div>
                      <Text strong>SEO评分: </Text>
                      <Progress
                        percent={selectedContent.seoScore}
                        status={selectedContent.seoScore >= 80 ? 'success' : 'normal'}
                        style={{ width: 200 }}
                      />
                    </div>
                    <div>
                      <Text strong>关键词: </Text>
                      <div style={{ marginTop: 8 }}>
                        {selectedContent.keywords.map((keyword, index) => (
                          <Tag key={index} style={{ marginBottom: 8 }}>
                            {keyword}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </Space>
                </Card>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>
    </div>
  );
}