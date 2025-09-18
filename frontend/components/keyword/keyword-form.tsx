'use client';

import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Card,
  Row,
  Col,
  Divider,
  Alert,
  Switch,
  Tag,
  AutoComplete,
  Tooltip,
  message,
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createKeywordSchema,
  updateKeywordSchema,
  aioConfigSchema,
  type CreateKeywordInput,
  type UpdateKeywordInput,
  type AIOConfigInput,
} from '@/lib/validations/keyword';
import {
  KeywordPriority,
  KeywordStatus,
  ChannelType,
  Keyword,
  AIOConfig,
} from '@/types/keyword';
import {
  PriorityBadge,
  ChannelBadge,
  TierBadge,
} from './keyword-badge';

const { Option } = Select;
const { TextArea } = Input;

interface KeywordFormProps {
  keyword?: Keyword | null;
  onSubmit: (data: CreateKeywordInput | UpdateKeywordInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  parentKeywords?: Keyword[];
}

export function KeywordForm({
  keyword,
  onSubmit,
  onCancel,
  loading = false,
  parentKeywords = [],
}: KeywordFormProps) {
  const [tags, setTags] = useState<string[]>(keyword?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [includeAIOConfig, setIncludeAIOConfig] = useState(!!keyword?.aioConfig);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);

  const isEditing = !!keyword;
  const schema = isEditing ? updateKeywordSchema : createKeywordSchema;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateKeywordInput | UpdateKeywordInput>({
    resolver: zodResolver(schema),
    defaultValues: keyword ? {
      id: keyword.id,
      term: keyword.term,
      priority: keyword.priority,
      status: keyword.status,
      channelType: keyword.channelType,
      tier: keyword.tier,
      parentId: keyword.parentId,
      searchVolume: keyword.searchVolume,
      competition: keyword.competition,
      cpc: keyword.cpc,
      description: keyword.description || '',
      tags: keyword.tags || [],
    } : {
      priority: KeywordPriority.P3,
      channelType: ChannelType.GOOGLE,
      tier: 1,
      searchVolume: 0,
      competition: 0,
      cpc: 0,
      description: '',
      tags: [],
    },
  });

  const watchedTerm = watch('term');
  const watchedParentId = watch('parentId');
  const watchedTier = watch('tier');

  // 当选择父关键词时，自动调整层级
  useEffect(() => {
    if (watchedParentId) {
      const parent = parentKeywords.find(p => p.id === watchedParentId);
      if (parent) {
        setValue('tier', parent.tier + 1);
      }
    } else {
      setValue('tier', 1);
    }
  }, [watchedParentId, parentKeywords, setValue]);

  // 模拟关键词建议
  useEffect(() => {
    if (watchedTerm && watchedTerm.length > 2) {
      const suggestions = [
        `${watchedTerm} 价格`,
        `${watchedTerm} 评测`,
        `${watchedTerm} 推荐`,
        `${watchedTerm} 对比`,
        `${watchedTerm} 安装`,
      ];
      setKeywordSuggestions(suggestions);
    } else {
      setKeywordSuggestions([]);
    }
  }, [watchedTerm]);

  const handleFormSubmit = async (data: any) => {
    try {
      const formData = { ...data, tags };
      await onSubmit(formData);
      message.success(isEditing ? '关键词更新成功' : '关键词创建成功');
    } catch (error) {
      message.error(isEditing ? '更新失败' : '创建失败');
    }
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag) && tags.length < 10) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeywordSuggestionSelect = (value: string) => {
    setValue('term', value);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Form layout="vertical">
        <Card
          title={
            <Space>
              <span>{isEditing ? '编辑关键词' : '创建关键词'}</span>
              {isEditing && keyword && (
                <PriorityBadge priority={keyword.priority} />
              )}
            </Space>
          }
          extra={
            <Space>
              <Button
                icon={<CloseOutlined />}
                onClick={onCancel}
                disabled={isSubmitting || loading}
              >
                取消
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSubmit(handleFormSubmit)}
                loading={isSubmitting || loading}
              >
                {isEditing ? '更新' : '创建'}
              </Button>
            </Space>
          }
        >
          <Row gutter={[24, 16]}>
            {/* 基本信息 */}
            <Col xs={24}>
              <Divider orientation="left">基本信息</Divider>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={
                  <Space>
                    关键词
                    <Tooltip title="关键词是用户搜索的核心词汇，建议使用常见的搜索词">
                      <InfoCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </Space>
                }
                help={errors.term?.message}
                validateStatus={errors.term ? 'error' : ''}
                required
              >
                <Controller
                  name="term"
                  control={control}
                  render={({ field }) => (
                    <AutoComplete
                      {...field}
                      options={keywordSuggestions.map(suggestion => ({
                        value: suggestion,
                        label: (
                          <Space>
                            <BulbOutlined className="text-yellow-500" />
                            {suggestion}
                          </Space>
                        ),
                      }))}
                      onSelect={handleKeywordSuggestionSelect}
                      placeholder="输入关键词..."
                      allowClear
                    />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="优先级"
                help={errors.priority?.message}
                validateStatus={errors.priority ? 'error' : ''}
                required
              >
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} placeholder="选择优先级">
                      {Object.values(KeywordPriority).map((priority) => (
                        <Option key={priority} value={priority}>
                          <Space>
                            <PriorityBadge priority={priority} />
                            <span>
                              {priority === KeywordPriority.P0 && '最高优先级'}
                              {priority === KeywordPriority.P1 && '高优先级'}
                              {priority === KeywordPriority.P2 && '中优先级'}
                              {priority === KeywordPriority.P3 && '低优先级'}
                              {priority === KeywordPriority.P4 && '最低优先级'}
                            </span>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="渠道类型"
                help={errors.channelType?.message}
                validateStatus={errors.channelType ? 'error' : ''}
                required
              >
                <Controller
                  name="channelType"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} placeholder="选择渠道类型">
                      {Object.values(ChannelType).map((channel) => (
                        <Option key={channel} value={channel}>
                          <ChannelBadge channelType={channel} />
                        </Option>
                      ))}
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>

            {isEditing && (
              <Col xs={24} md={12}>
                <Form.Item
                  label="状态"
                  help={errors.status?.message}
                  validateStatus={errors.status ? 'error' : ''}
                >
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} placeholder="选择状态">
                        <Option value={KeywordStatus.ACTIVE}>激活</Option>
                        <Option value={KeywordStatus.PAUSED}>暂停</Option>
                        <Option value={KeywordStatus.ARCHIVED}>归档</Option>
                      </Select>
                    )}
                  />
                </Form.Item>
              </Col>
            )}

            {/* 层级和关系 */}
            <Col xs={24}>
              <Divider orientation="left">层级和关系</Divider>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="父关键词"
                help="选择父关键词后，系统会自动设置相应的层级"
              >
                <Controller
                  name="parentId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="选择父关键词（可选）"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as string)
                          ?.toLowerCase()
                          ?.includes(input.toLowerCase())
                      }
                    >
                      {parentKeywords.map((parent) => (
                        <Option key={parent.id} value={parent.id}>
                          <Space>
                            <TierBadge tier={parent.tier} />
                            {parent.term}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="层级"
                help={errors.tier?.message}
                validateStatus={errors.tier ? 'error' : ''}
                required
              >
                <Controller
                  name="tier"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={1}
                      max={5}
                      style={{ width: '100%' }}
                      disabled={!!watchedParentId}
                      addonBefore={<TierBadge tier={watchedTier || 1} />}
                    />
                  )}
                />
              </Form.Item>
            </Col>

            {/* 搜索指标 */}
            <Col xs={24}>
              <Divider orientation="left">搜索指标</Divider>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="搜索量"
                help={errors.searchVolume?.message}
                validateStatus={errors.searchVolume ? 'error' : ''}
              >
                <Controller
                  name="searchVolume"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={0}
                      style={{ width: '100%' }}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      }
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                      placeholder="月搜索量"
                    />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="竞争度"
                help={errors.competition?.message}
                validateStatus={errors.competition ? 'error' : ''}
              >
                <Controller
                  name="competition"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={0}
                      max={1}
                      step={0.1}
                      style={{ width: '100%' }}
                      placeholder="0.0 - 1.0"
                    />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="CPC (¥)"
                help={errors.cpc?.message}
                validateStatus={errors.cpc ? 'error' : ''}
              >
                <Controller
                  name="cpc"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      placeholder="每次点击费用"
                    />
                  )}
                />
              </Form.Item>
            </Col>

            {/* 描述和标签 */}
            <Col xs={24}>
              <Divider orientation="left">描述和标签</Divider>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="描述"
                help={errors.description?.message}
                validateStatus={errors.description ? 'error' : ''}
              >
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      {...field}
                      rows={3}
                      placeholder="关键词描述、用途或注释..."
                      maxLength={500}
                      showCount
                    />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item label="标签">
                <Space direction="vertical" className="w-full">
                  <Space>
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onPressEnter={handleAddTag}
                      placeholder="输入标签"
                      style={{ width: 200 }}
                      maxLength={50}
                    />
                    <Button
                      icon={<PlusOutlined />}
                      onClick={handleAddTag}
                      disabled={!newTag || tags.length >= 10}
                    >
                      添加
                    </Button>
                  </Space>
                  
                  <div>
                    {tags.map((tag) => (
                      <Tag
                        key={tag}
                        closable
                        onClose={() => handleRemoveTag(tag)}
                        className="mb-2"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                  
                  {tags.length === 0 && (
                    <Alert
                      message="暂无标签"
                      description="标签可以帮助您更好地组织和管理关键词"
                      type="info"
                      showIcon
                      className="text-sm"
                    />
                  )}
                </Space>
              </Form.Item>
            </Col>

            {/* AIO 配置 */}
            <Col xs={24}>
              <Divider orientation="left">
                <Space>
                  AIO 配置
                  <Switch
                    size="small"
                    checked={includeAIOConfig}
                    onChange={setIncludeAIOConfig}
                    checkedChildren="启用"
                    unCheckedChildren="禁用"
                  />
                </Space>
              </Divider>
            </Col>

            {includeAIOConfig && (
              <>
                <Col xs={24}>
                  <Alert
                    message="AIO 自动优化"
                    description="启用 AIO 后，系统将根据设置的参数自动优化关键词的出价和排名"
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="目标排名" required>
                    <InputNumber
                      min={1}
                      max={10}
                      style={{ width: '100%' }}
                      placeholder="期望的搜索排名"
                      defaultValue={keyword?.aioConfig?.targetPosition || 3}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="最大出价 (¥)" required>
                    <InputNumber
                      min={0.01}
                      precision={2}
                      style={{ width: '100%' }}
                      placeholder="单次点击最高出价"
                      defaultValue={keyword?.aioConfig?.maxBid || 5.0}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="日预算 (¥)" required>
                    <InputNumber
                      min={1}
                      precision={2}
                      style={{ width: '100%' }}
                      placeholder="每日最大预算"
                      defaultValue={keyword?.aioConfig?.budget || 100.0}
                    />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Card>
      </Form>
    </div>
  );
}