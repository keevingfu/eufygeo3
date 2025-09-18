'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  Space,
  Button,
  Dropdown,
  Tooltip,
  Typography,
  Progress,
  Popover,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  SettingOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { Keyword, KeywordSortField, SortDirection } from '@/types/keyword';
import { useKeywordStore } from '@/stores/keyword-store';
import {
  PriorityBadge,
  AIOStatusBadge,
  KeywordStatusBadge,
  ChannelBadge,
  TierBadge,
} from './keyword-badge';
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatDateTime,
  getRelativeTime,
  getTrend,
  copyToClipboard,
} from '@/lib/utils';

const { Text, Link } = Typography;

interface KeywordTableProps {
  onEdit?: (keyword: Keyword) => void;
  onDelete?: (keyword: Keyword) => void;
  onView?: (keyword: Keyword) => void;
  onDuplicate?: (keyword: Keyword) => void;
}

export function KeywordTable({
  onEdit,
  onDelete,
  onView,
  onDuplicate,
}: KeywordTableProps) {
  const {
    keywords,
    selectedKeywords,
    isTableLoading,
    sort,
    setSelectedKeywords,
    toggleKeywordSelection,
    setSort,
    setCurrentKeyword,
  } = useKeywordStore();

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  // 表格列定义
  const columns: ColumnsType<Keyword> = useMemo(
    () => [
      {
        title: '关键词',
        dataIndex: 'term',
        key: 'term',
        width: 200,
        fixed: 'left',
        sorter: true,
        render: (term: string, record: Keyword) => (
          <Space direction="vertical" size={0}>
            <Link
              onClick={() => onView?.(record)}
              className="font-medium truncate max-w-48"
              title={term}
            >
              {term}
            </Link>
            <Space size={4}>
              <TierBadge tier={record.tier} />
              {record.children && record.children.length > 0 && (
                <Text type="secondary" className="text-xs">
                  {record.children.length} 个子关键词
                </Text>
              )}
            </Space>
          </Space>
        ),
      },
      {
        title: '优先级',
        dataIndex: 'priority',
        key: 'priority',
        width: 100,
        sorter: true,
        render: (priority) => <PriorityBadge priority={priority} />,
        filters: [
          { text: 'P0', value: 'P0' },
          { text: 'P1', value: 'P1' },
          { text: 'P2', value: 'P2' },
          { text: 'P3', value: 'P3' },
          { text: 'P4', value: 'P4' },
        ],
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status) => <KeywordStatusBadge status={status} />,
        filters: [
          { text: '激活', value: 'ACTIVE' },
          { text: '暂停', value: 'PAUSED' },
          { text: '归档', value: 'ARCHIVED' },
        ],
      },
      {
        title: 'AIO 状态',
        dataIndex: 'aioStatus',
        key: 'aioStatus',
        width: 120,
        render: (status) => <AIOStatusBadge status={status} />,
        filters: [
          { text: '激活', value: 'ACTIVE' },
          { text: '待处理', value: 'PENDING' },
          { text: '禁用', value: 'DISABLED' },
          { text: '错误', value: 'ERROR' },
        ],
      },
      {
        title: '渠道',
        dataIndex: 'channelType',
        key: 'channelType',
        width: 100,
        render: (channelType) => <ChannelBadge channelType={channelType} />,
        filters: [
          { text: 'Google', value: 'GOOGLE' },
          { text: 'Amazon', value: 'AMAZON' },
          { text: 'Facebook', value: 'FACEBOOK' },
          { text: 'Instagram', value: 'INSTAGRAM' },
          { text: 'YouTube', value: 'YOUTUBE' },
          { text: 'TikTok', value: 'TIKTOK' },
        ],
      },
      {
        title: '搜索量',
        dataIndex: 'searchVolume',
        key: 'searchVolume',
        width: 120,
        sorter: true,
        align: 'right',
        render: (volume: number, record: Keyword) => (
          <Space direction="vertical" size={0} className="text-right">
            <Text strong>{formatNumber(volume)}</Text>
            {record.metrics && (
              <TrendIndicator
                current={volume}
                previous={volume * 0.9} // 模拟历史数据
              />
            )}
          </Space>
        ),
      },
      {
        title: '竞争度',
        dataIndex: 'competition',
        key: 'competition',
        width: 120,
        sorter: true,
        align: 'center',
        render: (competition: number) => (
          <Tooltip title={`竞争度: ${formatPercentage(competition)}`}>
            <Progress
              percent={competition * 100}
              size="small"
              strokeColor={
                competition > 0.7
                  ? '#ef4444'
                  : competition > 0.4
                  ? '#f59e0b'
                  : '#10b981'
              }
              showInfo={false}
            />
          </Tooltip>
        ),
      },
      {
        title: 'CPC',
        dataIndex: 'cpc',
        key: 'cpc',
        width: 100,
        sorter: true,
        align: 'right',
        render: (cpc: number) => (
          <Text className="font-mono">{formatCurrency(cpc)}</Text>
        ),
      },
      {
        title: '性能指标',
        key: 'metrics',
        width: 150,
        render: (_, record: Keyword) => {
          if (!record.metrics) {
            return <Text type="secondary">无数据</Text>;
          }

          const { clicks, impressions, ctr, position } = record.metrics;

          return (
            <Popover
              content={
                <div className="space-y-2 min-w-48">
                  <div className="flex justify-between">
                    <span>展现量:</span>
                    <span className="font-mono">{formatNumber(impressions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>点击量:</span>
                    <span className="font-mono">{formatNumber(clicks)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>点击率:</span>
                    <span className="font-mono">{formatPercentage(ctr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>平均排名:</span>
                    <span className="font-mono">{position.toFixed(1)}</span>
                  </div>
                </div>
              }
              title="详细指标"
            >
              <Space direction="vertical" size={0} className="cursor-pointer">
                <Text className="text-xs">
                  CTR: {formatPercentage(ctr)}
                </Text>
                <Text className="text-xs">
                  排名: {position.toFixed(1)}
                </Text>
              </Space>
            </Popover>
          );
        },
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 120,
        sorter: true,
        render: (updatedAt: string) => (
          <Tooltip title={formatDateTime(updatedAt)}>
            <Text type="secondary" className="text-xs">
              {getRelativeTime(updatedAt)}
            </Text>
          </Tooltip>
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        fixed: 'right',
        render: (_, record: Keyword) => (
          <Space size={0}>
            <Tooltip title="查看详情">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onView?.(record)}
              />
            </Tooltip>
            
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'edit',
                    label: '编辑',
                    icon: <EditOutlined />,
                    onClick: () => onEdit?.(record),
                  },
                  {
                    key: 'duplicate',
                    label: '复制',
                    icon: <CopyOutlined />,
                    onClick: () => onDuplicate?.(record),
                  },
                  {
                    key: 'copy-term',
                    label: '复制关键词',
                    icon: <CopyOutlined />,
                    onClick: () => copyToClipboard(record.term),
                  },
                  { type: 'divider' },
                  {
                    key: 'aio-config',
                    label: 'AIO 配置',
                    icon: <SettingOutlined />,
                    onClick: () => {
                      // 打开 AIO 配置弹窗
                    },
                  },
                  { type: 'divider' },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => onDelete?.(record),
                  },
                ],
              }}
              trigger={['click']}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        ),
      },
    ],
    [onEdit, onDelete, onView, onDuplicate]
  );

  // 处理表格变化
  const handleTableChange: TableProps<Keyword>['onChange'] = (
    pagination,
    filters,
    sorter
  ) => {
    // 处理排序
    if (sorter && !Array.isArray(sorter) && sorter.field) {
      const sortField = sorter.field as string;
      const sortDirection = sorter.order === 'ascend' ? SortDirection.ASC : SortDirection.DESC;
      
      // 映射前端字段到后端字段
      const fieldMap: Record<string, KeywordSortField> = {
        term: KeywordSortField.TERM,
        priority: KeywordSortField.PRIORITY,
        searchVolume: KeywordSortField.SEARCH_VOLUME,
        competition: KeywordSortField.COMPETITION,
        cpc: KeywordSortField.CPC,
        updatedAt: KeywordSortField.UPDATED_AT,
      };

      const mappedField = fieldMap[sortField];
      if (mappedField) {
        setSort({ field: mappedField, direction: sortDirection });
      }
    }
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys: selectedKeywords,
    onChange: setSelectedKeywords,
    onSelect: (record: Keyword, selected: boolean) => {
      toggleKeywordSelection(record.id);
    },
    onSelectAll: (selected: boolean, selectedRows: Keyword[], changeRows: Keyword[]) => {
      if (selected) {
        const newSelected = [...selectedKeywords, ...changeRows.map(row => row.id)];
        setSelectedKeywords([...new Set(newSelected)]);
      } else {
        const removeIds = changeRows.map(row => row.id);
        setSelectedKeywords(selectedKeywords.filter(id => !removeIds.includes(id)));
      }
    },
  };

  return (
    <Table<Keyword>
      columns={columns}
      dataSource={keywords}
      rowKey="id"
      rowSelection={rowSelection}
      loading={isTableLoading}
      onChange={handleTableChange}
      scroll={{ x: 1200, y: 600 }}
      size="small"
      expandable={{
        expandedRowKeys,
        onExpand: (expanded, record) => {
          if (expanded) {
            setExpandedRowKeys([...expandedRowKeys, record.id]);
          } else {
            setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.id));
          }
        },
        expandedRowRender: (record) => (
          <div className="p-4 bg-gray-50 rounded">
            <Space direction="vertical" className="w-full">
              {record.children && record.children.length > 0 && (
                <div>
                  <Text strong className="text-sm">子关键词:</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {record.children.map((child) => (
                      <div
                        key={child.id}
                        className="bg-white px-3 py-1 rounded border text-sm"
                      >
                        {child.term}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {record.aioConfig && (
                <div>
                  <Text strong className="text-sm">AIO 配置:</Text>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Text type="secondary" className="text-xs">目标排名</Text>
                      <div>{record.aioConfig.targetPosition}</div>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">最大出价</Text>
                      <div>{formatCurrency(record.aioConfig.maxBid)}</div>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">预算</Text>
                      <div>{formatCurrency(record.aioConfig.budget)}</div>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">状态</Text>
                      <div>{record.aioConfig.enabled ? '启用' : '禁用'}</div>
                    </div>
                  </div>
                </div>
              )}
            </Space>
          </div>
        ),
        expandRowByClick: false,
      }}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
      onRow={(record) => ({
        onClick: () => setCurrentKeyword(record),
        className: 'cursor-pointer hover:bg-blue-50',
      })}
    />
  );
}

// 趋势指示器组件
function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const trend = getTrend(current, previous);
  const change = ((current - previous) / previous) * 100;

  if (trend === 'stable') {
    return (
      <Text type="secondary" className="text-xs">
        <MinusOutlined /> 稳定
      </Text>
    );
  }

  return (
    <Text
      type={trend === 'up' ? 'success' : 'danger'}
      className="text-xs"
    >
      {trend === 'up' ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
      {Math.abs(change).toFixed(1)}%
    </Text>
  );
}