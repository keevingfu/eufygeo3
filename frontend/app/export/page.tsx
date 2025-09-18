'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Table,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  Checkbox,
  message,
  Typography,
  Progress,
  List,
  Alert,
  Statistic,
  Radio,
  TimePicker,
  Divider,
  Timeline
} from 'antd';
import {
  FileExcelOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ExportOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  MailOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  supportedFormats: string[];
  sections: string[];
}

interface ExportJob {
  id: string;
  reportType: string;
  format: string;
  status: string;
  fileName: string;
  progress: number;
  fileSize?: number;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
}

const formatIcons: { [key: string]: React.ReactNode } = {
  PDF: <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />,
  EXCEL: <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
  CSV: <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
  DOCX: <FileWordOutlined style={{ fontSize: 24, color: '#2b5ce6' }} />,
  HTML: <FileTextOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
  JSON: <FileTextOutlined style={{ fontSize: 24, color: '#722ed1' }} />
};

const statusColors: { [key: string]: string } = {
  PENDING: 'default',
  PROCESSING: 'processing',
  COMPLETED: 'success',
  FAILED: 'error'
};

export default function ExportPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [scheduleForm] = Form.useForm();
  const router = useRouter();

  // 检查认证
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // 加载模拟数据
  useEffect(() => {
    // 模拟报告模板
    setTemplates([
      {
        id: '1',
        name: '关键词分析报告',
        description: '详细的关键词表现分析，包括搜索量、竞争度和趋势',
        type: 'KEYWORD_ANALYSIS',
        supportedFormats: ['PDF', 'EXCEL', 'CSV'],
        sections: ['概览', '关键词列表', '趋势分析', '机会识别', '建议']
      },
      {
        id: '2',
        name: '内容表现报告',
        description: 'AI生成内容的表现分析，包括SEO评分和参与度',
        type: 'CONTENT_PERFORMANCE',
        supportedFormats: ['PDF', 'DOCX', 'HTML'],
        sections: ['内容概览', 'SEO表现', '参与度指标', '优化建议']
      },
      {
        id: '3',
        name: '竞争对手分析',
        description: '市场竞争格局和对手表现对比',
        type: 'COMPETITOR_ANALYSIS',
        supportedFormats: ['PDF', 'EXCEL'],
        sections: ['市场份额', '关键词对比', '内容策略', 'SWOT分析']
      },
      {
        id: '4',
        name: '月度总结报告',
        description: '每月SEO表现的完整总结',
        type: 'MONTHLY_SUMMARY',
        supportedFormats: ['PDF', 'DOCX'],
        sections: ['执行摘要', '关键指标', '内容产出', '下月计划']
      }
    ]);

    // 模拟导出历史
    setExportJobs([
      {
        id: '1',
        reportType: 'KEYWORD_ANALYSIS',
        format: 'PDF',
        status: 'COMPLETED',
        fileName: '关键词分析_2025-09-15.pdf',
        progress: 100,
        fileSize: 1250000,
        downloadUrl: '#',
        createdAt: '2025-09-15T10:30:00',
        completedAt: '2025-09-15T10:32:00'
      },
      {
        id: '2',
        reportType: 'CONTENT_PERFORMANCE',
        format: 'EXCEL',
        status: 'COMPLETED',
        fileName: '内容表现_2025-09-14.xlsx',
        progress: 100,
        fileSize: 850000,
        downloadUrl: '#',
        createdAt: '2025-09-14T14:20:00',
        completedAt: '2025-09-14T14:22:00'
      },
      {
        id: '3',
        reportType: 'MONTHLY_SUMMARY',
        format: 'PDF',
        status: 'PROCESSING',
        fileName: '月度总结_2025-09.pdf',
        progress: 65,
        createdAt: '2025-09-17T18:15:00'
      }
    ]);
  }, []);

  // 处理导出
  const handleExport = (values: any) => {
    const newJob: ExportJob = {
      id: `export_${Date.now()}`,
      reportType: selectedTemplate?.type || 'CUSTOM',
      format: values.format,
      status: 'PROCESSING',
      fileName: `${values.title || selectedTemplate?.name}_${dayjs().format('YYYY-MM-DD')}.${values.format.toLowerCase()}`,
      progress: 0,
      createdAt: new Date().toISOString()
    };

    setExportJobs([newJob, ...exportJobs]);
    message.success('导出任务已创建，正在处理中...');
    setExportModalVisible(false);
    form.resetFields();

    // 模拟导出进度
    const progressInterval = setInterval(() => {
      setExportJobs(prev => {
        const updated = [...prev];
        const job = updated.find(j => j.id === newJob.id);
        if (job) {
          job.progress = Math.min(job.progress + 25, 100);
          if (job.progress === 100) {
            job.status = 'COMPLETED';
            job.completedAt = new Date().toISOString();
            job.downloadUrl = '#';
            job.fileSize = Math.floor(Math.random() * 2000000) + 500000;
            clearInterval(progressInterval);
          }
        }
        return updated;
      });
    }, 1000);
  };

  // 处理定时导出
  const handleScheduleExport = (values: any) => {
    message.success('定时导出已设置成功！');
    setScheduleModalVisible(false);
    scheduleForm.resetFields();
  };

  // 导出统计
  const exportStats = {
    total: exportJobs.length,
    completed: exportJobs.filter(j => j.status === 'COMPLETED').length,
    processing: exportJobs.filter(j => j.status === 'PROCESSING').length,
    totalSize: exportJobs.reduce((sum, job) => sum + (job.fileSize || 0), 0)
  };

  const columns = [
    {
      title: '报告名称',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string, record: ExportJob) => (
        <Space>
          {formatIcons[record.format]}
          <Text>{text}</Text>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'reportType',
      key: 'reportType',
      render: (type: string) => {
        const template = templates.find(t => t.type === type);
        return template?.name || type;
      }
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      render: (format: string) => <Tag>{format}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: ExportJob) => (
        <Space>
          <Tag color={statusColors[status]}>
            {status === 'PROCESSING' ? <LoadingOutlined /> : status === 'COMPLETED' ? <CheckCircleOutlined /> : null}
            {status}
          </Tag>
          {status === 'PROCESSING' && (
            <Progress percent={record.progress} size="small" style={{ width: 80 }} />
          )}
        </Space>
      )
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size?: number) => size ? `${(size / 1024 / 1024).toFixed(2)} MB` : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ExportJob) => (
        <Space>
          {record.status === 'COMPLETED' && record.downloadUrl && (
            <Button type="link" icon={<DownloadOutlined />} href={record.downloadUrl}>
              下载
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/keywords')}>
            返回
          </Button>
          <Title level={3} style={{ margin: 0 }}>导出报告中心</Title>
        </Space>
        <Button 
          type="primary" 
          icon={<CalendarOutlined />}
          onClick={() => setScheduleModalVisible(true)}
        >
          定时导出
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总导出数"
              value={exportStats.total}
              prefix={<ExportOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={exportStats.completed}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={exportStats.processing}
              valueStyle={{ color: '#1890ff' }}
              prefix={<LoadingOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总大小"
              value={(exportStats.totalSize / 1024 / 1024).toFixed(2)}
              suffix="MB"
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 报告模板 */}
      <Card title="可用报告模板" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {templates.map(template => (
            <Col span={6} key={template.id}>
              <Card
                hoverable
                onClick={() => {
                  setSelectedTemplate(template);
                  setExportModalVisible(true);
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Title level={5}>{template.name}</Title>
                  <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                    {template.description}
                  </Paragraph>
                  <Space wrap>
                    {template.supportedFormats.map(format => (
                      <Tag key={format} icon={formatIcons[format]}>
                        {format}
                      </Tag>
                    ))}
                  </Space>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    包含: {template.sections.join(' | ')}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 导出历史 */}
      <Card title="导出历史">
        <Table
          columns={columns}
          dataSource={exportJobs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 导出模态框 */}
      <Modal
        title={`导出${selectedTemplate?.name || '自定义报告'}`}
        open={exportModalVisible}
        onCancel={() => {
          setExportModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedTemplate && (
          <Alert
            message={selectedTemplate.description}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleExport}
          initialValues={{
            format: selectedTemplate?.supportedFormats[0]
          }}
        >
          <Form.Item
            name="title"
            label="报告标题"
          >
            <Input placeholder={`${selectedTemplate?.name || '自定义报告'}_${dayjs().format('YYYY-MM-DD')}`} />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="数据范围"
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="format"
            label="导出格式"
            rules={[{ required: true, message: '请选择导出格式' }]}
          >
            <Radio.Group>
              {(selectedTemplate?.supportedFormats || ['PDF', 'EXCEL']).map(format => (
                <Radio.Button key={format} value={format}>
                  {formatIcons[format]} {format}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          {selectedTemplate?.type === 'KEYWORD_ANALYSIS' && (
            <Form.Item
              name="includeKeywords"
              label="包含关键词"
            >
              <Select mode="tags" placeholder="选择或输入关键词">
                <Option value="eufy security camera">eufy security camera</Option>
                <Option value="eufy robot vacuum">eufy robot vacuum</Option>
                <Option value="eufy doorbell">eufy doorbell</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="sections"
            label="报告章节"
          >
            <Checkbox.Group>
              {selectedTemplate?.sections.map(section => (
                <Checkbox key={section} value={section} defaultChecked>
                  {section}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="emailOnComplete"
            valuePropName="checked"
          >
            <Checkbox>完成后发送邮件通知</Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<ExportOutlined />}>
                开始导出
              </Button>
              <Button onClick={() => {
                setExportModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 定时导出模态框 */}
      <Modal
        title="设置定时导出"
        open={scheduleModalVisible}
        onCancel={() => {
          setScheduleModalVisible(false);
          scheduleForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={scheduleForm}
          layout="vertical"
          onFinish={handleScheduleExport}
        >
          <Form.Item
            name="reportType"
            label="报告类型"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择报告类型">
              {templates.map(template => (
                <Option key={template.type} value={template.type}>
                  {template.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="format"
            label="导出格式"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择格式">
              <Option value="PDF">PDF</Option>
              <Option value="EXCEL">Excel</Option>
              <Option value="CSV">CSV</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="frequency"
            label="频率"
            rules={[{ required: true }]}
          >
            <Select placeholder="选择频率">
              <Option value="daily">每日</Option>
              <Option value="weekly">每周</Option>
              <Option value="monthly">每月</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="time"
            label="执行时间"
            rules={[{ required: true }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="recipients"
            label="接收邮箱"
            rules={[
              { required: true, message: '请输入接收邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="admin@eufy.com" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<CalendarOutlined />}>
                设置定时任务
              </Button>
              <Button onClick={() => {
                setScheduleModalVisible(false);
                scheduleForm.resetFields();
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