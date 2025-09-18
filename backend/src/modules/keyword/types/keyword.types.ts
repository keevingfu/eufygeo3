/**
 * 关键词管理模块 - TypeScript 类型定义
 * 
 * @description 完整的类型安全定义，包括所有实体、枚举和 DTO 类型
 * @author AI Assistant
 * @version 1.0.0
 */

import { Prisma, Keyword as PrismaKeyword, KeywordMetric as PrismaKeywordMetric } from '@prisma/client';

// ==================== 枚举类型定义 ====================

/**
 * 关键词优先级等级
 * P0: 最高优先级（核心产品关键词）
 * P1: 高优先级（主要功能关键词）
 * P2: 中等优先级（辅助功能关键词）
 * P3: 低优先级（长尾关键词）
 * P4: 最低优先级（实验性关键词）
 */
export enum KeywordPriorityLevel {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
}

/**
 * 关键词竞争等级
 */
export enum KeywordCompetitionLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * 搜索意图类型
 */
export enum KeywordIntentType {
  INFORMATIONAL = 'informational',    // 信息型
  NAVIGATIONAL = 'navigational',      // 导航型
  TRANSACTIONAL = 'transactional',    // 交易型
  COMMERCIAL = 'commercial',          // 商业型
}

/**
 * 产品线分类
 */
export enum ProductLine {
  CAMERA = 'camera',       // 摄像头
  DOORBELL = 'doorbell',   // 门铃
  VACUUM = 'vacuum',       // 扫地机器人
  LOCK = 'lock',          // 智能锁
}

/**
 * 营销漏斗阶段
 */
export enum MarketingFunnelStage {
  TOFU = 'TOFU',  // Top of Funnel - 认知阶段
  MOFU = 'MOFU',  // Middle of Funnel - 考虑阶段
  BOFU = 'BOFU',  // Bottom of Funnel - 决策阶段
}

/**
 * AIO (AI Overview) 状态
 */
export enum AIOStatus {
  NOT_MONITORED = 'not_monitored',    // 未监测
  MONITORED = 'monitored',            // 已监测
  DISPLAYED = 'displayed',            // 已显示
  NOT_DISPLAYED = 'not_displayed',    // 未显示
  COMPETING = 'competing',            // 竞争中
}

/**
 * 关键词状态
 */
export enum KeywordStatus {
  ACTIVE = 'active',        // 活跃
  INACTIVE = 'inactive',    // 非活跃
  ARCHIVED = 'archived',    // 已归档
  DRAFT = 'draft',         // 草稿
}

// ==================== 核心实体类型 ====================

/**
 * 关键词实体（扩展 Prisma 类型）
 */
export interface Keyword extends PrismaKeyword {
  readonly id: string;
  readonly text: string;
  readonly searchVolume: number | null;
  readonly difficulty: Prisma.Decimal | null;
  readonly cpc: Prisma.Decimal | null;
  readonly competitionLevel: KeywordCompetitionLevel | null;
  readonly priorityLevel: KeywordPriorityLevel | null;
  readonly intentType: KeywordIntentType | null;
  readonly productLine: ProductLine | null;
  readonly stage: MarketingFunnelStage | null;
  readonly aioStatus: AIOStatus;
  readonly aioFirstSeenAt: Date | null;
  readonly aioCoverageScore: Prisma.Decimal | null;
  readonly status: KeywordStatus;
  readonly assignedTo: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * 关键词指标实体
 */
export interface KeywordMetric extends PrismaKeywordMetric {
  readonly id: string;
  readonly keywordId: string;
  readonly metricDate: Date;
  readonly googlePosition: number | null;
  readonly googleFeaturedSnippet: boolean;
  readonly googlePeopleAlsoAsk: boolean;
  readonly aioDisplayed: boolean;
  readonly aioPosition: number | null;
  readonly aioContentSnippet: string | null;
  readonly organicTraffic: number | null;
  readonly organicCtr: Prisma.Decimal | null;
  readonly topCompetitors: Prisma.JsonValue | null;
  readonly createdAt: Date;
}

/**
 * 关键词与关联实体的完整信息
 */
export interface KeywordWithRelations extends Keyword {
  readonly assignee?: {
    readonly id: string;
    readonly username: string;
    readonly fullName: string | null;
  } | null;
  readonly creator: {
    readonly id: string;
    readonly username: string;
    readonly fullName: string | null;
  };
  readonly metrics?: ReadonlyArray<KeywordMetric>;
  readonly contentItems?: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly status: string;
  }>;
  readonly tasks?: ReadonlyArray<{
    readonly id: string;
    readonly title: string;
    readonly status: string;
  }>;
}

// ==================== 输入类型定义 (DTOs) ====================

/**
 * 创建关键词输入
 */
export interface CreateKeywordInput {
  readonly text: string;
  readonly searchVolume?: number | null;
  readonly difficulty?: number | null;
  readonly cpc?: number | null;
  readonly competitionLevel?: KeywordCompetitionLevel | null;
  readonly priorityLevel?: KeywordPriorityLevel | null;
  readonly intentType?: KeywordIntentType | null;
  readonly productLine?: ProductLine | null;
  readonly stage?: MarketingFunnelStage | null;
  readonly assignedTo?: string | null;
}

/**
 * 更新关键词输入
 */
export interface UpdateKeywordInput {
  readonly id: string;
  readonly text?: string;
  readonly searchVolume?: number | null;
  readonly difficulty?: number | null;
  readonly cpc?: number | null;
  readonly competitionLevel?: KeywordCompetitionLevel | null;
  readonly priorityLevel?: KeywordPriorityLevel | null;
  readonly intentType?: KeywordIntentType | null;
  readonly productLine?: ProductLine | null;
  readonly stage?: MarketingFunnelStage | null;
  readonly status?: KeywordStatus;
  readonly assignedTo?: string | null;
  readonly aioStatus?: AIOStatus;
  readonly aioCoverageScore?: number | null;
}

/**
 * 关键词过滤条件
 */
export interface KeywordFilters {
  readonly text?: string;
  readonly priorityLevel?: KeywordPriorityLevel | ReadonlyArray<KeywordPriorityLevel>;
  readonly status?: KeywordStatus | ReadonlyArray<KeywordStatus>;
  readonly competitionLevel?: KeywordCompetitionLevel | ReadonlyArray<KeywordCompetitionLevel>;
  readonly intentType?: KeywordIntentType | ReadonlyArray<KeywordIntentType>;
  readonly productLine?: ProductLine | ReadonlyArray<ProductLine>;
  readonly stage?: MarketingFunnelStage | ReadonlyArray<MarketingFunnelStage>;
  readonly aioStatus?: AIOStatus | ReadonlyArray<AIOStatus>;
  readonly assignedTo?: string | ReadonlyArray<string>;
  readonly createdBy?: string | ReadonlyArray<string>;
  readonly searchVolumeMin?: number;
  readonly searchVolumeMax?: number;
  readonly difficultyMin?: number;
  readonly difficultyMax?: number;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
}

/**
 * 排序选项
 */
export interface KeywordSortOptions {
  readonly field: keyof Pick<Keyword, 'text' | 'searchVolume' | 'difficulty' | 'cpc' | 'priorityLevel' | 'createdAt' | 'updatedAt'>;
  readonly direction: 'asc' | 'desc';
}

/**
 * 分页选项
 */
export interface PaginationOptions {
  readonly page?: number;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * 关键词查询选项
 */
export interface KeywordQueryOptions {
  readonly filters?: KeywordFilters;
  readonly sort?: KeywordSortOptions | ReadonlyArray<KeywordSortOptions>;
  readonly pagination?: PaginationOptions;
  readonly includeRelations?: {
    readonly assignee?: boolean;
    readonly creator?: boolean;
    readonly metrics?: boolean | {
      readonly limit?: number;
      readonly orderBy?: 'metricDate';
    };
    readonly contentItems?: boolean;
    readonly tasks?: boolean;
  };
}

/**
 * 分页结果类型
 */
export interface PaginatedKeywords {
  readonly data: ReadonlyArray<KeywordWithRelations>;
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

// ==================== AIO 相关类型 ====================

/**
 * AIO 监测数据输入
 */
export interface AIOMonitoringInput {
  readonly keywordId: string;
  readonly aioDisplayed: boolean;
  readonly aioPosition?: number | null;
  readonly aioContentSnippet?: string | null;
  readonly metricDate: Date;
}

/**
 * AIO 统计数据
 */
export interface AIOStats {
  readonly totalMonitored: number;
  readonly totalDisplayed: number;
  readonly displayRate: number;
  readonly averagePosition: number | null;
  readonly coverageByPriority: Record<KeywordPriorityLevel, {
    readonly monitored: number;
    readonly displayed: number;
    readonly rate: number;
  }>;
}

// ==================== 批量操作类型 ====================

/**
 * 批量更新输入
 */
export interface BulkUpdateKeywordsInput {
  readonly keywordIds: ReadonlyArray<string>;
  readonly updates: Partial<Pick<UpdateKeywordInput, 
    'priorityLevel' | 'status' | 'assignedTo' | 'competitionLevel' | 
    'intentType' | 'productLine' | 'stage'
  >>;
}

/**
 * 批量操作结果
 */
export interface BulkOperationResult {
  readonly success: boolean;
  readonly updatedCount: number;
  readonly errors: ReadonlyArray<{
    readonly keywordId: string;
    readonly error: string;
  }>;
}

// ==================== 错误类型 ====================

/**
 * 关键词操作错误类型
 */
export enum KeywordErrorCode {
  KEYWORD_NOT_FOUND = 'KEYWORD_NOT_FOUND',
  KEYWORD_ALREADY_EXISTS = 'KEYWORD_ALREADY_EXISTS',
  INVALID_PRIORITY_LEVEL = 'INVALID_PRIORITY_LEVEL',
  INVALID_AIO_STATUS = 'INVALID_AIO_STATUS',
  ASSIGNEE_NOT_FOUND = 'ASSIGNEE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

/**
 * 关键词业务异常
 */
export interface KeywordError extends Error {
  readonly code: KeywordErrorCode;
  readonly details?: Record<string, unknown>;
}

// ==================== 工具类型 ====================

/**
 * 提取部分关键词字段的工具类型
 */
export type PartialKeyword<T extends keyof Keyword = keyof Keyword> = Pick<Keyword, T>;

/**
 * 关键词创建时的必需字段
 */
export type RequiredForCreate = 'text' | 'createdBy';

/**
 * 关键词更新时的可选字段
 */
export type OptionalForUpdate = Exclude<keyof Keyword, 'id' | 'createdAt' | 'createdBy'>;

/**
 * 类型安全的 Prisma 查询条件
 */
export type KeywordWhereInput = Prisma.KeywordWhereInput;
export type KeywordOrderByInput = Prisma.KeywordOrderByWithRelationInput;
export type KeywordIncludeInput = Prisma.KeywordInclude;

// ==================== 导出所有类型 ====================

export type {
  PrismaKeyword,
  PrismaKeywordMetric,
};