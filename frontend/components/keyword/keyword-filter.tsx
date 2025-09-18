'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Switch,
  Divider,
} from 'antd';
import { SearchOutlined, ClearOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  KeywordPriority,
  KeywordStatus,
  ChannelType,
  AIOStatus,
  KeywordFilter,
} from '@/types/keyword';
import { useKeywordStore } from '@/stores/keyword-store';
import { debounce } from '@/lib/utils';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface KeywordFilterPanelProps {
  visible: boolean;
  onClose?: () => void;
}

export function KeywordFilterPanel({ visible, onClose }: KeywordFilterPanelProps) {
  const [form] = Form.useForm();
  const { filter, setFilter, clearFilter } = useKeywordStore();
  
  const [localFilter, setLocalFilter] = useState<Partial<KeywordFilter>>(filter);

  // 防抖更新筛选器
  const debouncedSetFilter = useCallback(
    debounce((values: Partial<KeywordFilter>) => {
      setFilter(values);
    }, 300),
    [setFilter]
  );

  const handleFilterChange = (changedValues: any, allValues: any) => {
    const newFilter = { ...localFilter, ...changedValues };
    setLocalFilter(newFilter);
    debouncedSetFilter(newFilter);
  };

  const handleClear = () => {
    form.resetFields();
    setLocalFilter({});
    clearFilter();
  };

  const handleApply = () => {
    const values = form.getFieldsValue();
    setFilter(values);
    onClose?.();
  };

  if (!visible) return null;

  return (
    <Card
      title={
        <Space>
          <FilterOutlined />
          筛选条件
        </Space>
      }
      extra={
        <Space>
          <Button size="small" onClick={handleClear} icon={<ClearOutlined />}>
            清空
          </Button>
          <Button type="primary" size="small" onClick={handleApply}>
            应用
          </Button>
        </Space>
      }
      className="mb-4"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={filter}
        onValuesChange={handleFilterChange}
        size="small"
      >
        <Row gutter={[16, 8]}>
          {/* 关键词搜索 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="关键词" name="term">
              <Input
                placeholder="搜索关键词..."
                prefix={<SearchOutlined />}
                allowClear
              />
            </Form.Item>
          </Col>

          {/* 优先级 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="优先级" name="priority">
              <Select
                mode="multiple"
                placeholder="选择优先级"
                allowClear
                maxTagCount="responsive"
              >
                {Object.values(KeywordPriority).map((priority) => (
                  <Option key={priority} value={priority}>
                    {priority}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* 状态 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="状态" name="status">
              <Select
                mode="multiple"
                placeholder="选择状态"
                allowClear
                maxTagCount="responsive"
              >
                {Object.values(KeywordStatus).map((status) => (
                  <Option key={status} value={status}>
                    {status === KeywordStatus.ACTIVE && '激活'}
                    {status === KeywordStatus.PAUSED && '暂停'}
                    {status === KeywordStatus.ARCHIVED && '归档'}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* 渠道类型 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="渠道" name="channelType">
              <Select
                mode="multiple"
                placeholder="选择渠道"
                allowClear
                maxTagCount="responsive"
              >
                {Object.values(ChannelType).map((channel) => (
                  <Option key={channel} value={channel}>
                    {channel}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* AIO 状态 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="AIO 状态" name="aioStatus">
              <Select
                mode="multiple"
                placeholder="选择 AIO 状态"
                allowClear
                maxTagCount="responsive"
              >
                {Object.values(AIOStatus).map((status) => (
                  <Option key={status} value={status}>
                    {status === AIOStatus.ACTIVE && '激活'}
                    {status === AIOStatus.PENDING && '待处理'}
                    {status === AIOStatus.DISABLED && '禁用'}
                    {status === AIOStatus.ERROR && '错误'}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* 层级 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="层级" name="tier">
              <Select
                mode="multiple"
                placeholder="选择层级"
                allowClear
                maxTagCount="responsive"
              >
                {[1, 2, 3, 4, 5].map((tier) => (
                  <Option key={tier} value={tier}>
                    T{tier}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" orientationMargin="0">
          数值范围筛选
        </Divider>

        <Row gutter={[16, 8]}>
          {/* 搜索量范围 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="搜索量">
              <Input.Group compact>
                <Form.Item name="searchVolumeMin" noStyle>
                  <InputNumber
                    placeholder="最小值"
                    style={{ width: '50%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
                <Form.Item name="searchVolumeMax" noStyle>
                  <InputNumber
                    placeholder="最大值"
                    style={{ width: '50%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Col>

          {/* 竞争度范围 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="竞争度">
              <Input.Group compact>
                <Form.Item name="competitionMin" noStyle>
                  <InputNumber
                    placeholder="最小值"
                    style={{ width: '50%' }}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </Form.Item>
                <Form.Item name="competitionMax" noStyle>
                  <InputNumber
                    placeholder="最大值"
                    style={{ width: '50%' }}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Col>

          {/* CPC 范围 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="CPC (¥)">
              <Input.Group compact>
                <Form.Item name="cpcMin" noStyle>
                  <InputNumber
                    placeholder="最小值"
                    style={{ width: '50%' }}
                    min={0}
                    step={0.01}
                    precision={2}
                  />
                </Form.Item>
                <Form.Item name="cpcMax" noStyle>
                  <InputNumber
                    placeholder="最大值"
                    style={{ width: '50%' }}
                    min={0}
                    step={0.01}
                    precision={2}
                  />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" orientationMargin="0">
          时间范围筛选
        </Divider>

        <Row gutter={[16, 8]}>
          {/* 创建时间范围 */}
          <Col xs={24} sm={12}>
            <Form.Item label="创建时间">
              <RangePicker
                style={{ width: '100%' }}
                onChange={(dates) => {
                  if (dates) {
                    form.setFieldsValue({
                      createdAfter: dates[0]?.toISOString(),
                      createdBefore: dates[1]?.toISOString(),
                    });
                  } else {
                    form.setFieldsValue({
                      createdAfter: undefined,
                      createdBefore: undefined,
                    });
                  }
                }}
              />
            </Form.Item>
          </Col>

          {/* 其他选项 */}
          <Col xs={24} sm={12}>
            <Form.Item label="其他选项">
              <Space direction="vertical">
                <Form.Item name="hasChildren" valuePropName="checked" noStyle>
                  <Switch size="small" />
                  <span className="ml-2">有子关键词</span>
                </Form.Item>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}

// 简化的筛选栏
export function KeywordQuickFilter() {
  const { filter, setFilter } = useKeywordStore();

  const handleQuickFilter = (key: string, value: any) => {
    setFilter({ [key]: value });
  };

  return (
    <Card className="mb-4">
      <Space wrap>
        <span className="text-gray-600">快速筛选：</span>
        
        <Button
          size="small"
          type={filter.priority?.includes(KeywordPriority.P0) ? 'primary' : 'default'}
          onClick={() => handleQuickFilter('priority', [KeywordPriority.P0])}
        >
          P0 优先级
        </Button>
        
        <Button
          size="small"
          type={filter.aioStatus?.includes(AIOStatus.ACTIVE) ? 'primary' : 'default'}
          onClick={() => handleQuickFilter('aioStatus', [AIOStatus.ACTIVE])}
        >
          AIO 激活
        </Button>
        
        <Button
          size="small"
          type={filter.aioStatus?.includes(AIOStatus.ERROR) ? 'primary' : 'default'}
          onClick={() => handleQuickFilter('aioStatus', [AIOStatus.ERROR])}
        >
          AIO 错误
        </Button>
        
        <Button
          size="small"
          type={filter.hasChildren ? 'primary' : 'default'}
          onClick={() => handleQuickFilter('hasChildren', true)}
        >
          有子关键词
        </Button>
        
        <Button
          size="small"
          type={!filter.hasChildren && filter.hasChildren !== undefined ? 'primary' : 'default'}
          onClick={() => handleQuickFilter('hasChildren', false)}
        >
          叶子节点
        </Button>
      </Space>
    </Card>
  );
}