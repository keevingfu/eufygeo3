'use client';

import { useState } from 'react';
import {
  Modal,
  Select,
  Button,
  Space,
  Alert,
  Form,
  InputNumber,
  Switch,
  Progress,
  Typography,
  List,
  Tag,
  Divider,
  message,
  Upload,
  Card,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import {
  KeywordPriority,
  KeywordStatus,
  AIOStatus,
  BulkActionType,
  Keyword,
} from '@/types/keyword';
import { useKeywordStore } from '@/stores/keyword-store';
import { PriorityBadge, AIOStatusBadge, KeywordStatusBadge } from './keyword-badge';
import { formatNumber, downloadFile } from '@/lib/utils';

const { Option } = Select;
const { Text, Title } = Typography;
const { Dragger } = Upload;

interface BulkActionsProps {
  visible: boolean;
  onClose: () => void;
  selectedKeywords: string[];
  keywords: Keyword[];
}

export function BulkActions({
  visible,
  onClose,
  selectedKeywords,
  keywords,
}: BulkActionsProps) {
  const [actionType, setActionType] = useState<BulkActionType | null>(null);
  const [actionValue, setActionValue] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const { executeBulkAction, isBulkActionLoading } = useKeywordStore();

  const selectedKeywordObjects = keywords.filter(k => selectedKeywords.includes(k.id));

  const handleAction = async () => {
    if (!actionType || selectedKeywords.length === 0) {
      message.warning('请选择操作类型和关键词');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await executeBulkAction({
        type: actionType,
        keywordIds: selectedKeywords,
        value: actionValue,
      });

      clearInterval(progressInterval);
      setProgress(100);

      // 模拟结果
      setResults({
        success: selectedKeywords.length,
        failed: 0,
        errors: [],
      });

      message.success(`批量操作完成，成功处理 ${selectedKeywords.length} 个关键词`);
    } catch (error) {
      setResults({
        success: selectedKeywords.length - 1,
        failed: 1,
        errors: ['部分关键词操作失败'],
      });
      message.error('批量操作部分失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    const exportData = selectedKeywordObjects.map(keyword => ({
      关键词: keyword.term,
      优先级: keyword.priority,
      状态: keyword.status,
      渠道: keyword.channelType,
      层级: keyword.tier,
      搜索量: keyword.searchVolume,
      竞争度: keyword.competition,
      CPC: keyword.cpc,
      创建时间: keyword.createdAt,
      更新时间: keyword.updatedAt,
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(',')),
    ].join('\n');

    downloadFile(csv, `keywords_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    message.success('导出成功');
  };

  const handleClose = () => {
    setActionType(null);
    setActionValue(null);
    setIsProcessing(false);
    setProgress(0);
    setResults(null);
    onClose();
  };

  const renderActionForm = () => {
    switch (actionType) {
      case BulkActionType.UPDATE_STATUS:
        return (
          <Form.Item label="目标状态" required>
            <Select
              value={actionValue}
              onChange={setActionValue}
              placeholder="选择状态"
            >
              <Option value={KeywordStatus.ACTIVE}>
                <KeywordStatusBadge status={KeywordStatus.ACTIVE} />
              </Option>
              <Option value={KeywordStatus.PAUSED}>
                <KeywordStatusBadge status={KeywordStatus.PAUSED} />
              </Option>
              <Option value={KeywordStatus.ARCHIVED}>
                <KeywordStatusBadge status={KeywordStatus.ARCHIVED} />
              </Option>
            </Select>
          </Form.Item>
        );

      case BulkActionType.UPDATE_PRIORITY:
        return (
          <Form.Item label="目标优先级" required>
            <Select
              value={actionValue}
              onChange={setActionValue}
              placeholder="选择优先级"
            >
              {Object.values(KeywordPriority).map(priority => (
                <Option key={priority} value={priority}>
                  <PriorityBadge priority={priority} />
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case BulkActionType.UPDATE_AIO_STATUS:
        return (
          <Form.Item label="AIO 状态" required>
            <Select
              value={actionValue}
              onChange={setActionValue}
              placeholder="选择 AIO 状态"
            >
              <Option value={AIOStatus.ACTIVE}>
                <AIOStatusBadge status={AIOStatus.ACTIVE} />
              </Option>
              <Option value={AIOStatus.PENDING}>
                <AIOStatusBadge status={AIOStatus.PENDING} />
              </Option>
              <Option value={AIOStatus.DISABLED}>
                <AIOStatusBadge status={AIOStatus.DISABLED} />
              </Option>
            </Select>
          </Form.Item>
        );

      default:
        return null;
    }
  };

  const getActionDescription = () => {
    switch (actionType) {
      case BulkActionType.UPDATE_STATUS:
        return '批量更新关键词状态，可以同时激活、暂停或归档多个关键词';
      case BulkActionType.UPDATE_PRIORITY:
        return '批量调整关键词优先级，影响资源分配和优化策略';
      case BulkActionType.UPDATE_AIO_STATUS:
        return '批量设置 AIO 状态，控制自动优化功能的启用';
      case BulkActionType.DELETE:
        return '永久删除选中的关键词，此操作不可撤销';
      case BulkActionType.EXPORT:
        return '导出选中关键词的详细信息到 CSV 文件';
      default:
        return '';
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case BulkActionType.UPDATE_STATUS:
        return <EditOutlined />;
      case BulkActionType.UPDATE_PRIORITY:
        return <EditOutlined />;
      case BulkActionType.UPDATE_AIO_STATUS:
        return <PlayCircleOutlined />;
      case BulkActionType.DELETE:
        return <DeleteOutlined />;
      case BulkActionType.EXPORT:
        return <ExportOutlined />;
      default:
        return <EditOutlined />;
    }
  };

  const isDangerousAction = actionType === BulkActionType.DELETE;

  return (
    <Modal
      title={
        <Space>
          <span>批量操作</span>
          <Tag color="blue">{selectedKeywords.length} 个关键词</Tag>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={null}
    >
      <div className="space-y-6">
        {/* 选择操作类型 */}
        <Card size="small" title="选择操作">
          <Select
            value={actionType}
            onChange={setActionType}
            placeholder="请选择要执行的操作"
            style={{ width: '100%' }}
            size="large"
          >
            <Option value={BulkActionType.UPDATE_STATUS}>
              <Space>
                <EditOutlined />
                更新状态
              </Space>
            </Option>
            <Option value={BulkActionType.UPDATE_PRIORITY}>
              <Space>
                <EditOutlined />
                调整优先级
              </Space>
            </Option>
            <Option value={BulkActionType.UPDATE_AIO_STATUS}>
              <Space>
                <PlayCircleOutlined />
                设置 AIO 状态
              </Space>
            </Option>
            <Option value={BulkActionType.EXPORT}>
              <Space>
                <ExportOutlined />
                导出数据
              </Space>
            </Option>
            <Option value={BulkActionType.DELETE}>
              <Space>
                <DeleteOutlined />
                删除关键词
              </Space>
            </Option>
          </Select>

          {actionType && (
            <Alert
              message={getActionDescription()}
              type={isDangerousAction ? 'warning' : 'info'}
              showIcon
              className="mt-4"
            />
          )}
        </Card>

        {/* 操作参数配置 */}
        {actionType && actionType !== BulkActionType.DELETE && actionType !== BulkActionType.EXPORT && (
          <Card size="small" title="配置参数">
            <Form layout="vertical">
              {renderActionForm()}
            </Form>
          </Card>
        )}

        {/* 影响的关键词列表 */}
        <Card
          size="small"
          title={`将影响的关键词 (${selectedKeywords.length})`}
          extra={
            <Button size="small" onClick={handleExport}>
              导出列表
            </Button>
          }
        >
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            <List
              size="small"
              dataSource={selectedKeywordObjects.slice(0, 10)}
              renderItem={(keyword) => (
                <List.Item>
                  <Space>
                    <Text strong>{keyword.term}</Text>
                    <PriorityBadge priority={keyword.priority} />
                    <KeywordStatusBadge status={keyword.status} />
                    <AIOStatusBadge status={keyword.aioStatus} />
                  </Space>
                </List.Item>
              )}
            />
            {selectedKeywordObjects.length > 10 && (
              <div className="text-center py-2 text-gray-500">
                还有 {selectedKeywordObjects.length - 10} 个关键词...
              </div>
            )}
          </div>
        </Card>

        {/* 处理进度 */}
        {isProcessing && (
          <Card size="small" title="处理进度">
            <Progress
              percent={progress}
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <Text type="secondary" className="text-sm">
              正在处理 {selectedKeywords.length} 个关键词...
            </Text>
          </Card>
        )}

        {/* 处理结果 */}
        {results && (
          <Card size="small" title="处理结果">
            <Space direction="vertical" className="w-full">
              <div className="flex justify-between">
                <Text>成功:</Text>
                <Text type="success" strong>
                  {formatNumber(results.success)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text>失败:</Text>
                <Text type="danger" strong>
                  {formatNumber(results.failed)}
                </Text>
              </div>
              
              {results.errors.length > 0 && (
                <Alert
                  message="处理过程中出现错误"
                  description={
                    <ul className="list-disc list-inside">
                      {results.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  }
                  type="error"
                  showIcon
                />
              )}
            </Space>
          </Card>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end">
          <Space>
            <Button onClick={handleClose}>
              {results ? '关闭' : '取消'}
            </Button>
            
            {!results && actionType === BulkActionType.EXPORT && (
              <Button
                type="primary"
                icon={<ExportOutlined />}
                onClick={handleExport}
              >
                导出
              </Button>
            )}
            
            {!results && actionType && actionType !== BulkActionType.EXPORT && (
              <Button
                type={isDangerousAction ? 'primary' : 'primary'}
                danger={isDangerousAction}
                icon={getActionIcon()}
                onClick={handleAction}
                loading={isProcessing || isBulkActionLoading}
                disabled={
                  (actionType !== BulkActionType.DELETE && !actionValue) ||
                  selectedKeywords.length === 0
                }
              >
                {isDangerousAction ? '确认删除' : '执行操作'}
              </Button>
            )}
          </Space>
        </div>
      </div>
    </Modal>
  );
}

// 批量导入组件
interface BulkImportProps {
  visible: boolean;
  onClose: () => void;
  onImport: (keywords: any[]) => Promise<void>;
}

export function BulkImport({ visible, onClose, onImport }: BulkImportProps) {
  const [fileData, setFileData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (info: any) => {
    const { file, fileList } = info;
    
    if (file.status === 'done' || file.status === 'uploading') {
      // 这里应该解析 CSV/Excel 文件
      // 暂时模拟数据
      const mockData = [
        { term: '智能门锁', priority: 'P1', channelType: 'GOOGLE', tier: 1 },
        { term: '智能摄像头', priority: 'P2', channelType: 'GOOGLE', tier: 1 },
      ];
      setFileData(mockData);
    }
  };

  const handleImport = async () => {
    if (fileData.length === 0) {
      message.warning('请先上传文件');
      return;
    }

    try {
      setIsProcessing(true);
      await onImport(fileData);
      message.success(`成功导入 ${fileData.length} 个关键词`);
      onClose();
    } catch (error) {
      message.error('导入失败');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      title="批量导入关键词"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            onClick={handleImport}
            loading={isProcessing}
            disabled={fileData.length === 0}
          >
            导入 {fileData.length > 0 && `(${fileData.length})`}
          </Button>
        </Space>
      }
    >
      <div className="space-y-4">
        <Alert
          message="导入说明"
          description={
            <ul className="list-disc list-inside mt-2">
              <li>支持 CSV 和 Excel 文件格式</li>
              <li>文件大小不超过 5MB</li>
              <li>单次最多导入 1000 个关键词</li>
              <li>必填字段：关键词、优先级、渠道类型、层级</li>
            </ul>
          }
          type="info"
          showIcon
        />

        <Dragger
          name="file"
          multiple={false}
          accept=".csv,.xlsx,.xls"
          customRequest={({ onSuccess }) => {
            setTimeout(() => {
              onSuccess?.('ok');
            }, 1000);
          }}
          onChange={handleFileUpload}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持 CSV 和 Excel 格式的关键词数据文件
          </p>
        </Dragger>

        {fileData.length > 0 && (
          <Card size="small" title={`预览数据 (${fileData.length} 条)`}>
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              <List
                size="small"
                dataSource={fileData}
                renderItem={(item, index) => (
                  <List.Item>
                    <Space>
                      <Text>{index + 1}.</Text>
                      <Text strong>{item.term}</Text>
                      <PriorityBadge priority={item.priority} />
                      <Tag>{item.channelType}</Tag>
                      <Tag>T{item.tier}</Tag>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
}