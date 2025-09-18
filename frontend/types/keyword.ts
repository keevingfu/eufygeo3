// 关键词优先级枚举
export enum KeywordPriority {
  P0 = 'P0',
  P1 = 'P1', 
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
}

// AIO 状态枚举
export enum AIOStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  DISABLED = 'DISABLED',
  ERROR = 'ERROR',
}

// 渠道类型
export enum ChannelType {
  GOOGLE = 'GOOGLE',
  AMAZON = 'AMAZON',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
}

// 关键词状态
export enum KeywordStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

// 基础关键词类型
export interface Keyword {
  id: string;
  term: string;
  priority: KeywordPriority;
  status: KeywordStatus;
  channelType: ChannelType;
  tier: number;
  parentId?: string;
  aioStatus: AIOStatus;
  searchVolume: number;
  competition: number;
  cpc: number;
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  children?: Keyword[];
  parent?: Keyword;
  metrics?: KeywordMetrics;
  aioConfig?: AIOConfig;
}

// 关键词指标
export interface KeywordMetrics {
  id: string;
  keywordId: string;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  conversions: number;
  revenue: number;
  createdAt: string;
}

// AIO 配置
export interface AIOConfig {
  id: string;
  keywordId: string;
  enabled: boolean;
  targetPosition: number;
  maxBid: number;
  budget: number;
  schedule?: AIOSchedule;
  rules?: AIORule[];
  createdAt: string;
  updatedAt: string;
}

// AIO 调度
export interface AIOSchedule {
  id: string;
  configId: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  timezone: string;
}

// AIO 规则
export interface AIORule {
  id: string;
  configId: string;
  condition: string;
  action: string;
  value: number;
  enabled: boolean;
}

// 分页信息
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
  totalCount: number;
}

// 关键词连接（分页）
export interface KeywordEdge {
  node: Keyword;
  cursor: string;
}

// 关键词连接集合
export interface KeywordConnection {
  edges: KeywordEdge[];
  pageInfo: PageInfo;
}

// 关键词筛选器
export interface KeywordFilter {
  term?: string;
  priority?: KeywordPriority[];
  status?: KeywordStatus[];
  channelType?: ChannelType[];
  tier?: number[];
  aioStatus?: AIOStatus[];
  searchVolumeMin?: number;
  searchVolumeMax?: number;
  competitionMin?: number;
  competitionMax?: number;
  cpcMin?: number;
  cpcMax?: number;
  parentId?: string;
  hasChildren?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

// 排序选项
export interface KeywordSort {
  field: KeywordSortField;
  direction: SortDirection;
}

export enum KeywordSortField {
  TERM = 'TERM',
  PRIORITY = 'PRIORITY',
  STATUS = 'STATUS',
  SEARCH_VOLUME = 'SEARCH_VOLUME',
  COMPETITION = 'COMPETITION',
  CPC = 'CPC',
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

// 批量操作类型
export enum BulkActionType {
  UPDATE_STATUS = 'UPDATE_STATUS',
  UPDATE_PRIORITY = 'UPDATE_PRIORITY',
  UPDATE_AIO_STATUS = 'UPDATE_AIO_STATUS',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
}

// 批量操作输入
export interface BulkActionInput {
  type: BulkActionType;
  keywordIds: string[];
  value?: any;
}

// 关键词创建输入
export interface CreateKeywordInput {
  term: string;
  priority: KeywordPriority;
  channelType: ChannelType;
  tier: number;
  parentId?: string;
  searchVolume?: number;
  competition?: number;
  cpc?: number;
}

// 关键词更新输入
export interface UpdateKeywordInput {
  id: string;
  term?: string;
  priority?: KeywordPriority;
  status?: KeywordStatus;
  channelType?: ChannelType;
  tier?: number;
  parentId?: string;
  searchVolume?: number;
  competition?: number;
  cpc?: number;
}

// AIO 配置输入
export interface CreateAIOConfigInput {
  keywordId: string;
  enabled: boolean;
  targetPosition: number;
  maxBid: number;
  budget: number;
}

export interface UpdateAIOConfigInput {
  id: string;
  enabled?: boolean;
  targetPosition?: number;
  maxBid?: number;
  budget?: number;
}

// 表格列配置
export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: Keyword) => React.ReactNode;
}

// 图表数据点
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// 性能指标趋势
export interface MetricsTrend {
  metric: string;
  data: ChartDataPoint[];
  change: number;
  changePercent: number;
}

// API 响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// 错误类型
export interface ApiError {
  message: string;
  code: string;
  field?: string;
}

// 加载状态
export interface LoadingState {
  isLoading: boolean;
  error?: ApiError;
}

// 表单验证规则
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message: string;
}