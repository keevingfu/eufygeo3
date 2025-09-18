'use client';

import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Select,
  Space,
  Spin,
  Alert,
  Typography,
  Divider,
  Tag,
  Row,
  Col,
  Statistic,
  Timeline,
  List,
  Collapse,
  message,
  Tooltip
} from 'antd';
import {
  FileTextOutlined,
  BulbOutlined,
  OrderedListOutlined,
  QuestionCircleOutlined,
  KeyOutlined,
  CopyOutlined,
  DownloadOutlined,
  RocketOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

interface ContentOutline {
  title: string;
  meta_description: string;
  target_keyword: string;
  word_count: number;
  sections: OutlineSection[];
  keywords_to_include: string[];
  questions_to_answer: string[];
}

interface OutlineSection {
  heading: string;
  level: number;
  content_points: string[];
  keywords: string[];
  word_count_estimate: number;
}

export default function ContentOutlinePage() {
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [contentType, setContentType] = useState('blog');
  const [outline, setOutline] = useState<ContentOutline | null>(null);

  // 生成内容大纲
  const handleGenerateOutline = async () => {
    if (!keyword) {
      message.warning('请输入关键词');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4006/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation GenerateContentOutline($keyword: String!, $contentType: String!) {
              generateContentOutline(keyword: $keyword, contentType: $contentType) {
                title
                meta_description
                target_keyword
                word_count
                sections {
                  heading
                  level
                  content_points
                  keywords
                  word_count_estimate
                }
                keywords_to_include
                questions_to_answer
              }
            }
          `,
          variables: { keyword, contentType }
        })
      });

      const data = await response.json();
      if (data.data?.generateContentOutline) {
        setOutline(data.data.generateContentOutline);
        message.success('内容大纲生成成功！');
      }
    } catch (error) {
      message.error('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${type}已复制到剪贴板`);
  };

  // 导出为 Markdown
  const exportAsMarkdown = () => {
    if (!outline) return;

    let markdown = `# ${outline.title}\n\n`;
    markdown += `**Meta Description:** ${outline.meta_description}\n\n`;
    markdown += `**Target Keyword:** ${outline.target_keyword}\n\n`;
    markdown += `**Recommended Word Count:** ${outline.word_count}\n\n`;
    
    markdown += `## Content Outline\n\n`;
    
    outline.sections.forEach((section) => {
      const headingLevel = '#'.repeat(section.level + 1);
      markdown += `${headingLevel} ${section.heading}\n\n`;
      markdown += `**Word Count:** ~${section.word_count_estimate} words\n\n`;
      markdown += `**Key Points:**\n`;
      section.content_points.forEach(point => {
        markdown += `- ${point}\n`;
      });
      markdown += `\n**Keywords:** ${section.keywords.join(', ')}\n\n`;
    });

    markdown += `## Keywords to Include\n\n`;
    outline.keywords_to_include.forEach(kw => {
      markdown += `- ${kw}\n`;
    });

    markdown += `\n## Questions to Answer\n\n`;
    outline.questions_to_answer.forEach(q => {
      markdown += `- ${q}\n`;
    });

    // 创建下载链接
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${outline.target_keyword.replace(/\s+/g, '-')}-outline.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success('大纲已导出');
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>智能内容大纲生成</Title>
        <Paragraph type="secondary">
          基于 AI 和竞争对手分析，自动生成 SEO 优化的内容大纲
        </Paragraph>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>目标关键词</Text>
            <Input
              size="large"
              placeholder="输入要创建内容的主要关键词"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              prefix={<KeyOutlined />}
              style={{ marginTop: 8 }}
            />
          </div>

          <div>
            <Text strong>内容类型</Text>
            <Select
              size="large"
              style={{ width: '100%', marginTop: 8 }}
              value={contentType}
              onChange={setContentType}
            >
              <Select.Option value="blog">博客文章</Select.Option>
              <Select.Option value="how-to">操作指南</Select.Option>
              <Select.Option value="comparison">产品比较</Select.Option>
              <Select.Option value="review">产品评测</Select.Option>
              <Select.Option value="guide">完整指南</Select.Option>
            </Select>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            loading={loading}
            onClick={handleGenerateOutline}
            style={{ width: '100%' }}
          >
            生成智能大纲
          </Button>
        </Space>
      </Card>

      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" tip="正在分析竞争对手并生成大纲..." />
            <Paragraph style={{ marginTop: 16 }}>
              这可能需要 30-60 秒，请耐心等待...
            </Paragraph>
          </div>
        </Card>
      )}

      {outline && !loading && (
        <div>
          {/* 基础信息卡片 */}
          <Card
            title="内容概览"
            extra={
              <Space>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(outline.title, '标题')}
                >
                  复制标题
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={exportAsMarkdown}
                >
                  导出 Markdown
                </Button>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message="建议标题"
                  description={outline.title}
                  type="success"
                  showIcon
                  icon={<BulbOutlined />}
                />
              </Col>
              <Col span={24}>
                <Alert
                  message="元描述"
                  description={outline.meta_description}
                  type="info"
                  showIcon
                  action={
                    <Button
                      size="small"
                      onClick={() => copyToClipboard(outline.meta_description, '元描述')}
                    >
                      复制
                    </Button>
                  }
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="目标关键词"
                  value={outline.target_keyword}
                  prefix={<KeyOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="建议字数"
                  value={outline.word_count}
                  suffix="字"
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="内容章节"
                  value={outline.sections.length}
                  suffix="个"
                  prefix={<OrderedListOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* 内容大纲 */}
          <Card
            title="详细大纲"
            style={{ marginBottom: 16 }}
          >
            <Timeline>
              {outline.sections.map((section, index) => (
                <Timeline.Item
                  key={index}
                  dot={section.level === 1 ? <BulbOutlined /> : undefined}
                  color={section.level === 1 ? 'green' : 'blue'}
                >
                  <Card size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Title level={section.level + 3}>{section.heading}</Title>
                        <Tag color="blue">{section.word_count_estimate} 字</Tag>
                      </div>
                      
                      <Collapse ghost>
                        <Panel header="内容要点" key="1">
                          <List
                            size="small"
                            dataSource={section.content_points}
                            renderItem={(point) => (
                              <List.Item>
                                <Text>• {point}</Text>
                              </List.Item>
                            )}
                          />
                        </Panel>
                      </Collapse>

                      <Space size="small" wrap>
                        <Text type="secondary">关键词：</Text>
                        {section.keywords.map((kw, i) => (
                          <Tag key={i} color="purple">{kw}</Tag>
                        ))}
                      </Space>
                    </Space>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>

          {/* 关键词和问题 */}
          <Row gutter={16}>
            <Col span={12}>
              <Card
                title={
                  <Space>
                    <KeyOutlined />
                    <span>建议包含的关键词</span>
                  </Space>
                }
              >
                <Space wrap>
                  {outline.keywords_to_include.map((kw, index) => (
                    <Tag
                      key={index}
                      color="green"
                      style={{ cursor: 'pointer' }}
                      onClick={() => copyToClipboard(kw, '关键词')}
                    >
                      {kw}
                    </Tag>
                  ))}
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card
                title={
                  <Space>
                    <QuestionCircleOutlined />
                    <span>需要回答的问题</span>
                  </Space>
                }
              >
                <List
                  size="small"
                  dataSource={outline.questions_to_answer}
                  renderItem={(question) => (
                    <List.Item>
                      <Tooltip title="点击复制">
                        <Text
                          style={{ cursor: 'pointer' }}
                          onClick={() => copyToClipboard(question, '问题')}
                        >
                          {question}
                        </Text>
                      </Tooltip>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}