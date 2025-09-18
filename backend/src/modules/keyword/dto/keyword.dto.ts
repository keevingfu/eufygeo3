/**
 * 关键词管理模块 - GraphQL DTO 定义
 * 
 * @description GraphQL 输入输出类型定义，使用 class-validator 进行数据验证
 * @author AI Assistant
 * @version 1.0.0
 */

import {
  ObjectType,
  InputType,
  Field,
  ID,
  Int,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDate,
  IsUUID,
  Min,
  Max,
  Length,
  IsArray,
  ValidateNested,
  IsPositive,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { GraphQLDecimal } from 'prisma-graphql-type-decimal';
import {
  KeywordPriorityLevel,
  KeywordCompetitionLevel,
  KeywordIntentType,
  ProductLine,
  MarketingFunnelStage,
  AIOStatus,
  KeywordStatus,
} from '../types/keyword.types';

// ==================== 枚举注册 ====================

registerEnumType(KeywordPriorityLevel, {
  name: 'KeywordPriorityLevel',
  description: '关键词优先级等级 (P0-P4)',
});

registerEnumType(KeywordCompetitionLevel, {
  name: 'KeywordCompetitionLevel',
  description: '关键词竞争等级',
});

registerEnumType(KeywordIntentType, {
  name: 'KeywordIntentType',
  description: '搜索意图类型',
});

registerEnumType(ProductLine, {
  name: 'ProductLine',
  description: '产品线分类',
});

registerEnumType(MarketingFunnelStage, {
  name: 'MarketingFunnelStage',
  description: '营销漏斗阶段',
});

registerEnumType(AIOStatus, {
  name: 'AIOStatus',
  description: 'AIO (AI Overview) 状态',
});

registerEnumType(KeywordStatus, {
  name: 'KeywordStatus',
  description: '关键词状态',
});

// ==================== 输出类型 (ObjectTypes) ====================

/**
 * 用户信息输出类型
 */
@ObjectType('UserInfo')
export class UserInfoDto {
  @Field(() => ID)
  readonly id: string;

  @Field()
  readonly username: string;

  @Field({ nullable: true })
  readonly fullName?: string;
}

/**
 * 关键词指标输出类型
 */
@ObjectType('KeywordMetric')
export class KeywordMetricDto {
  @Field(() => ID)
  readonly id: string;

  @Field(() => ID)
  readonly keywordId: string;

  @Field()
  readonly metricDate: Date;

  @Field(() => Int, { nullable: true, description: 'Google 搜索排名位置' })
  readonly googlePosition?: number;

  @Field({ description: '是否出现在 Google 精选摘要中' })
  readonly googleFeaturedSnippet: boolean;

  @Field({ description: '是否出现在 People Also Ask 中' })
  readonly googlePeopleAlsoAsk: boolean;

  @Field({ description: 'AIO 是否显示' })
  readonly aioDisplayed: boolean;

  @Field(() => Int, { nullable: true, description: 'AIO 显示位置' })
  readonly aioPosition?: number;

  @Field({ nullable: true, description: 'AIO 内容摘要' })
  readonly aioContentSnippet?: string;

  @Field(() => Int, { nullable: true, description: '自然流量' })
  readonly organicTraffic?: number;

  @Field(() => GraphQLDecimal, { nullable: true, description: '自然点击率' })
  readonly organicCtr?: number;

  @Field()
  readonly createdAt: Date;
}

/**
 * 内容项目信息输出类型
 */
@ObjectType('ContentItemInfo')
export class ContentItemInfoDto {
  @Field(() => ID)
  readonly id: string;

  @Field()
  readonly title: string;

  @Field()
  readonly status: string;
}

/**
 * 任务信息输出类型
 */
@ObjectType('TaskInfo')
export class TaskInfoDto {
  @Field(() => ID)
  readonly id: string;

  @Field()
  readonly title: string;

  @Field()
  readonly status: string;
}

/**
 * 关键词输出类型
 */
@ObjectType('Keyword')
export class KeywordDto {
  @Field(() => ID)
  readonly id: string;

  @Field({ description: '关键词文本' })
  readonly text: string;

  @Field(() => Int, { nullable: true, description: '搜索量' })
  readonly searchVolume?: number;

  @Field(() => GraphQLDecimal, { nullable: true, description: '关键词难度 (0-100)' })
  readonly difficulty?: number;

  @Field(() => GraphQLDecimal, { nullable: true, description: '每次点击成本 (CPC)' })
  readonly cpc?: number;

  @Field(() => KeywordCompetitionLevel, { nullable: true, description: '竞争等级' })
  readonly competitionLevel?: KeywordCompetitionLevel;

  @Field(() => KeywordPriorityLevel, { nullable: true, description: '优先级等级' })
  readonly priorityLevel?: KeywordPriorityLevel;

  @Field(() => KeywordIntentType, { nullable: true, description: '搜索意图类型' })
  readonly intentType?: KeywordIntentType;

  @Field(() => ProductLine, { nullable: true, description: '产品线' })
  readonly productLine?: ProductLine;

  @Field(() => MarketingFunnelStage, { nullable: true, description: '营销漏斗阶段' })
  readonly stage?: MarketingFunnelStage;

  @Field(() => AIOStatus, { description: 'AIO 状态' })
  readonly aioStatus: AIOStatus;

  @Field({ nullable: true, description: 'AIO 首次发现时间' })
  readonly aioFirstSeenAt?: Date;

  @Field(() => GraphQLDecimal, { nullable: true, description: 'AIO 覆盖率得分' })
  readonly aioCoverageScore?: number;

  @Field(() => KeywordStatus, { description: '关键词状态' })
  readonly status: KeywordStatus;

  @Field(() => ID, { nullable: true, description: '分配给用户 ID' })
  readonly assignedTo?: string;

  @Field(() => ID, { description: '创建者用户 ID' })
  readonly createdBy: string;

  @Field()
  readonly createdAt: Date;

  @Field()
  readonly updatedAt: Date;

  // 关联数据
  @Field(() => UserInfoDto, { nullable: true, description: '分配的用户' })
  readonly assignee?: UserInfoDto;

  @Field(() => UserInfoDto, { description: '创建者' })
  readonly creator: UserInfoDto;

  @Field(() => [KeywordMetricDto], { nullable: true, description: '关键词指标历史' })
  readonly metrics?: KeywordMetricDto[];

  @Field(() => [ContentItemInfoDto], { nullable: true, description: '关联的内容项目' })
  readonly contentItems?: ContentItemInfoDto[];

  @Field(() => [TaskInfoDto], { nullable: true, description: '关联的任务' })
  readonly tasks?: TaskInfoDto[];
}

/**
 * 分页信息输出类型
 */
@ObjectType('PaginationInfo')
export class PaginationInfoDto {
  @Field(() => Int, { description: '总记录数' })
  readonly total: number;

  @Field(() => Int, { description: '当前页码' })
  readonly page: number;

  @Field(() => Int, { description: '每页记录数' })
  readonly limit: number;

  @Field(() => Int, { description: '总页数' })
  readonly totalPages: number;

  @Field({ description: '是否有下一页' })
  readonly hasNextPage: boolean;

  @Field({ description: '是否有上一页' })
  readonly hasPreviousPage: boolean;
}

/**
 * 分页关键词结果输出类型
 */
@ObjectType('PaginatedKeywords')
export class PaginatedKeywordsDto {
  @Field(() => [KeywordDto], { description: '关键词列表' })
  readonly data: KeywordDto[];

  @Field(() => PaginationInfoDto, { description: '分页信息' })
  readonly pagination: PaginationInfoDto;
}

/**
 * AIO 统计数据输出类型
 */
@ObjectType('AIOStatsByPriority')
export class AIOStatsByPriorityDto {
  @Field(() => Int, { description: '监测数量' })
  readonly monitored: number;

  @Field(() => Int, { description: '显示数量' })
  readonly displayed: number;

  @Field(() => Float, { description: '显示率' })
  readonly rate: number;
}

@ObjectType('AIOStats')
export class AIOStatsDto {
  @Field(() => Int, { description: '总监测数量' })
  readonly totalMonitored: number;

  @Field(() => Int, { description: '总显示数量' })
  readonly totalDisplayed: number;

  @Field(() => Float, { description: '整体显示率' })
  readonly displayRate: number;

  @Field(() => Float, { nullable: true, description: '平均显示位置' })
  readonly averagePosition?: number;

  @Field(() => AIOStatsByPriorityDto, { description: 'P0 级别统计' })
  readonly p0Stats: AIOStatsByPriorityDto;

  @Field(() => AIOStatsByPriorityDto, { description: 'P1 级别统计' })
  readonly p1Stats: AIOStatsByPriorityDto;

  @Field(() => AIOStatsByPriorityDto, { description: 'P2 级别统计' })
  readonly p2Stats: AIOStatsByPriorityDto;

  @Field(() => AIOStatsByPriorityDto, { description: 'P3 级别统计' })
  readonly p3Stats: AIOStatsByPriorityDto;

  @Field(() => AIOStatsByPriorityDto, { description: 'P4 级别统计' })
  readonly p4Stats: AIOStatsByPriorityDto;
}

// ==================== 输入类型 (InputTypes) ====================

/**
 * 创建关键词输入类型
 */
@InputType('CreateKeywordInput')
export class CreateKeywordInputDto {
  @Field({ description: '关键词文本' })
  @IsString()
  @Length(1, 255, { message: '关键词文本长度必须在 1-255 字符之间' })
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, { message: '关键词只能包含字母、数字、空格、连字符和下划线' })
  readonly text: string;

  @Field(() => Int, { nullable: true, description: '搜索量' })
  @IsOptional()
  @IsNumber({}, { message: '搜索量必须是数字' })
  @Min(0, { message: '搜索量不能为负数' })
  readonly searchVolume?: number;

  @Field(() => Float, { nullable: true, description: '关键词难度 (0-100)' })
  @IsOptional()
  @IsNumber({}, { message: '关键词难度必须是数字' })
  @Min(0, { message: '关键词难度不能小于 0' })
  @Max(100, { message: '关键词难度不能大于 100' })
  readonly difficulty?: number;

  @Field(() => Float, { nullable: true, description: '每次点击成本 (CPC)' })
  @IsOptional()
  @IsNumber({}, { message: 'CPC 必须是数字' })
  @Min(0, { message: 'CPC 不能为负数' })
  readonly cpc?: number;

  @Field(() => KeywordCompetitionLevel, { nullable: true, description: '竞争等级' })
  @IsOptional()
  @IsEnum(KeywordCompetitionLevel, { message: '无效的竞争等级' })
  readonly competitionLevel?: KeywordCompetitionLevel;

  @Field(() => KeywordPriorityLevel, { nullable: true, description: '优先级等级' })
  @IsOptional()
  @IsEnum(KeywordPriorityLevel, { message: '无效的优先级等级' })
  readonly priorityLevel?: KeywordPriorityLevel;

  @Field(() => KeywordIntentType, { nullable: true, description: '搜索意图类型' })
  @IsOptional()
  @IsEnum(KeywordIntentType, { message: '无效的搜索意图类型' })
  readonly intentType?: KeywordIntentType;

  @Field(() => ProductLine, { nullable: true, description: '产品线' })
  @IsOptional()
  @IsEnum(ProductLine, { message: '无效的产品线' })
  readonly productLine?: ProductLine;

  @Field(() => MarketingFunnelStage, { nullable: true, description: '营销漏斗阶段' })
  @IsOptional()
  @IsEnum(MarketingFunnelStage, { message: '无效的营销漏斗阶段' })
  readonly stage?: MarketingFunnelStage;

  @Field(() => ID, { nullable: true, description: '分配给用户 ID' })
  @IsOptional()
  @IsUUID(4, { message: '无效的用户 ID 格式' })
  readonly assignedTo?: string;
}

/**
 * 更新关键词输入类型
 */
@InputType('UpdateKeywordInput')
export class UpdateKeywordInputDto {
  @Field(() => ID, { description: '关键词 ID' })
  @IsUUID(4, { message: '无效的关键词 ID 格式' })
  readonly id: string;

  @Field({ nullable: true, description: '关键词文本' })
  @IsOptional()
  @IsString()
  @Length(1, 255, { message: '关键词文本长度必须在 1-255 字符之间' })
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, { message: '关键词只能包含字母、数字、空格、连字符和下划线' })
  readonly text?: string;

  @Field(() => Int, { nullable: true, description: '搜索量' })
  @IsOptional()
  @IsNumber({}, { message: '搜索量必须是数字' })
  @Min(0, { message: '搜索量不能为负数' })
  readonly searchVolume?: number;

  @Field(() => Float, { nullable: true, description: '关键词难度 (0-100)' })
  @IsOptional()
  @IsNumber({}, { message: '关键词难度必须是数字' })
  @Min(0, { message: '关键词难度不能小于 0' })
  @Max(100, { message: '关键词难度不能大于 100' })
  readonly difficulty?: number;

  @Field(() => Float, { nullable: true, description: '每次点击成本 (CPC)' })
  @IsOptional()
  @IsNumber({}, { message: 'CPC 必须是数字' })
  @Min(0, { message: 'CPC 不能为负数' })
  readonly cpc?: number;

  @Field(() => KeywordCompetitionLevel, { nullable: true, description: '竞争等级' })
  @IsOptional()
  @IsEnum(KeywordCompetitionLevel, { message: '无效的竞争等级' })
  readonly competitionLevel?: KeywordCompetitionLevel;

  @Field(() => KeywordPriorityLevel, { nullable: true, description: '优先级等级' })
  @IsOptional()
  @IsEnum(KeywordPriorityLevel, { message: '无效的优先级等级' })
  readonly priorityLevel?: KeywordPriorityLevel;

  @Field(() => KeywordIntentType, { nullable: true, description: '搜索意图类型' })
  @IsOptional()
  @IsEnum(KeywordIntentType, { message: '无效的搜索意图类型' })
  readonly intentType?: KeywordIntentType;

  @Field(() => ProductLine, { nullable: true, description: '产品线' })
  @IsOptional()
  @IsEnum(ProductLine, { message: '无效的产品线' })
  readonly productLine?: ProductLine;

  @Field(() => MarketingFunnelStage, { nullable: true, description: '营销漏斗阶段' })
  @IsOptional()
  @IsEnum(MarketingFunnelStage, { message: '无效的营销漏斗阶段' })
  readonly stage?: MarketingFunnelStage;

  @Field(() => KeywordStatus, { nullable: true, description: '关键词状态' })
  @IsOptional()
  @IsEnum(KeywordStatus, { message: '无效的关键词状态' })
  readonly status?: KeywordStatus;

  @Field(() => ID, { nullable: true, description: '分配给用户 ID' })
  @IsOptional()
  @IsUUID(4, { message: '无效的用户 ID 格式' })
  readonly assignedTo?: string;

  @Field(() => AIOStatus, { nullable: true, description: 'AIO 状态' })
  @IsOptional()
  @IsEnum(AIOStatus, { message: '无效的 AIO 状态' })
  readonly aioStatus?: AIOStatus;

  @Field(() => Float, { nullable: true, description: 'AIO 覆盖率得分' })
  @IsOptional()
  @IsNumber({}, { message: 'AIO 覆盖率得分必须是数字' })
  @Min(0, { message: 'AIO 覆盖率得分不能小于 0' })
  @Max(100, { message: 'AIO 覆盖率得分不能大于 100' })
  readonly aioCoverageScore?: number;
}

/**
 * 关键词过滤条件输入类型
 */
@InputType('KeywordFiltersInput')
export class KeywordFiltersInputDto {
  @Field({ nullable: true, description: '关键词文本搜索' })
  @IsOptional()
  @IsString()
  readonly text?: string;

  @Field(() => [KeywordPriorityLevel], { nullable: true, description: '优先级等级过滤' })
  @IsOptional()
  @IsArray()
  @IsEnum(KeywordPriorityLevel, { each: true, message: '无效的优先级等级' })
  readonly priorityLevels?: KeywordPriorityLevel[];

  @Field(() => [KeywordStatus], { nullable: true, description: '状态过滤' })
  @IsOptional()
  @IsArray()
  @IsEnum(KeywordStatus, { each: true, message: '无效的关键词状态' })
  readonly statuses?: KeywordStatus[];

  @Field(() => [KeywordCompetitionLevel], { nullable: true, description: '竞争等级过滤' })
  @IsOptional()
  @IsArray()
  @IsEnum(KeywordCompetitionLevel, { each: true, message: '无效的竞争等级' })
  readonly competitionLevels?: KeywordCompetitionLevel[];

  @Field(() => [KeywordIntentType], { nullable: true, description: '搜索意图类型过滤' })
  @IsOptional()
  @IsArray()
  @IsEnum(KeywordIntentType, { each: true, message: '无效的搜索意图类型' })
  readonly intentTypes?: KeywordIntentType[];

  @Field(() => [ProductLine], { nullable: true, description: '产品线过滤' })
  @IsOptional()
  @IsArray()
  @IsEnum(ProductLine, { each: true, message: '无效的产品线' })
  readonly productLines?: ProductLine[];

  @Field(() => [AIOStatus], { nullable: true, description: 'AIO 状态过滤' })
  @IsOptional()
  @IsArray()
  @IsEnum(AIOStatus, { each: true, message: '无效的 AIO 状态' })
  readonly aioStatuses?: AIOStatus[];

  @Field(() => [ID], { nullable: true, description: '分配用户过滤' })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true, message: '无效的用户 ID 格式' })
  readonly assignedToUsers?: string[];

  @Field(() => Int, { nullable: true, description: '最小搜索量' })
  @IsOptional()
  @IsNumber({}, { message: '最小搜索量必须是数字' })
  @Min(0, { message: '最小搜索量不能为负数' })
  readonly searchVolumeMin?: number;

  @Field(() => Int, { nullable: true, description: '最大搜索量' })
  @IsOptional()
  @IsNumber({}, { message: '最大搜索量必须是数字' })
  @Min(0, { message: '最大搜索量不能为负数' })
  readonly searchVolumeMax?: number;

  @Field(() => Float, { nullable: true, description: '最小难度' })
  @IsOptional()
  @IsNumber({}, { message: '最小难度必须是数字' })
  @Min(0, { message: '最小难度不能小于 0' })
  @Max(100, { message: '最小难度不能大于 100' })
  readonly difficultyMin?: number;

  @Field(() => Float, { nullable: true, description: '最大难度' })
  @IsOptional()
  @IsNumber({}, { message: '最大难度必须是数字' })
  @Min(0, { message: '最大难度不能小于 0' })
  @Max(100, { message: '最大难度不能大于 100' })
  readonly difficultyMax?: number;

  @Field({ nullable: true, description: '创建时间起始' })
  @IsOptional()
  @IsDate({ message: '无效的日期格式' })
  @Transform(({ value }) => new Date(value))
  readonly createdAfter?: Date;

  @Field({ nullable: true, description: '创建时间结束' })
  @IsOptional()
  @IsDate({ message: '无效的日期格式' })
  @Transform(({ value }) => new Date(value))
  readonly createdBefore?: Date;
}

/**
 * 排序选项输入类型
 */
@InputType('KeywordSortInput')
export class KeywordSortInputDto {
  @Field({ description: '排序字段' })
  @IsString()
  readonly field: 'text' | 'searchVolume' | 'difficulty' | 'cpc' | 'priorityLevel' | 'createdAt' | 'updatedAt';

  @Field({ description: '排序方向' })
  @IsEnum(['asc', 'desc'], { message: '排序方向必须是 asc 或 desc' })
  readonly direction: 'asc' | 'desc';
}

/**
 * 分页选项输入类型
 */
@InputType('PaginationInput')
export class PaginationInputDto {
  @Field(() => Int, { nullable: true, description: '页码 (从 1 开始)', defaultValue: 1 })
  @IsOptional()
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码必须大于 0' })
  readonly page?: number = 1;

  @Field(() => Int, { nullable: true, description: '每页记录数', defaultValue: 20 })
  @IsOptional()
  @IsNumber({}, { message: '每页记录数必须是数字' })
  @Min(1, { message: '每页记录数必须大于 0' })
  @Max(100, { message: '每页记录数不能超过 100' })
  readonly limit?: number = 20;
}

/**
 * 关键词查询输入类型
 */
@InputType('KeywordQueryInput')
export class KeywordQueryInputDto {
  @Field(() => KeywordFiltersInputDto, { nullable: true, description: '过滤条件' })
  @IsOptional()
  @ValidateNested()
  @Type(() => KeywordFiltersInputDto)
  readonly filters?: KeywordFiltersInputDto;

  @Field(() => [KeywordSortInputDto], { nullable: true, description: '排序选项' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeywordSortInputDto)
  readonly sort?: KeywordSortInputDto[];

  @Field(() => PaginationInputDto, { nullable: true, description: '分页选项' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationInputDto)
  readonly pagination?: PaginationInputDto;
}

/**
 * AIO 监测数据输入类型
 */
@InputType('AIOMonitoringInput')
export class AIOMonitoringInputDto {
  @Field(() => ID, { description: '关键词 ID' })
  @IsUUID(4, { message: '无效的关键词 ID 格式' })
  readonly keywordId: string;

  @Field({ description: 'AIO 是否显示' })
  @IsBoolean({ message: 'AIO 显示状态必须是布尔值' })
  readonly aioDisplayed: boolean;

  @Field(() => Int, { nullable: true, description: 'AIO 显示位置' })
  @IsOptional()
  @IsNumber({}, { message: 'AIO 位置必须是数字' })
  @IsPositive({ message: 'AIO 位置必须是正数' })
  readonly aioPosition?: number;

  @Field({ nullable: true, description: 'AIO 内容摘要' })
  @IsOptional()
  @IsString()
  @Length(0, 1000, { message: 'AIO 内容摘要长度不能超过 1000 字符' })
  readonly aioContentSnippet?: string;

  @Field({ description: '监测日期' })
  @IsDate({ message: '无效的日期格式' })
  @Transform(({ value }) => new Date(value))
  readonly metricDate: Date;
}

/**
 * 批量更新输入类型
 */
@InputType('BulkUpdateKeywordsInput')
export class BulkUpdateKeywordsInputDto {
  @Field(() => [ID], { description: '关键词 ID 列表' })
  @IsArray()
  @IsUUID(4, { each: true, message: '无效的关键词 ID 格式' })
  readonly keywordIds: string[];

  @Field(() => KeywordPriorityLevel, { nullable: true, description: '批量更新优先级' })
  @IsOptional()
  @IsEnum(KeywordPriorityLevel, { message: '无效的优先级等级' })
  readonly priorityLevel?: KeywordPriorityLevel;

  @Field(() => KeywordStatus, { nullable: true, description: '批量更新状态' })
  @IsOptional()
  @IsEnum(KeywordStatus, { message: '无效的关键词状态' })
  readonly status?: KeywordStatus;

  @Field(() => ID, { nullable: true, description: '批量分配给用户' })
  @IsOptional()
  @IsUUID(4, { message: '无效的用户 ID 格式' })
  readonly assignedTo?: string;

  @Field(() => KeywordCompetitionLevel, { nullable: true, description: '批量更新竞争等级' })
  @IsOptional()
  @IsEnum(KeywordCompetitionLevel, { message: '无效的竞争等级' })
  readonly competitionLevel?: KeywordCompetitionLevel;

  @Field(() => KeywordIntentType, { nullable: true, description: '批量更新搜索意图' })
  @IsOptional()
  @IsEnum(KeywordIntentType, { message: '无效的搜索意图类型' })
  readonly intentType?: KeywordIntentType;

  @Field(() => ProductLine, { nullable: true, description: '批量更新产品线' })
  @IsOptional()
  @IsEnum(ProductLine, { message: '无效的产品线' })
  readonly productLine?: ProductLine;

  @Field(() => MarketingFunnelStage, { nullable: true, description: '批量更新营销漏斗阶段' })
  @IsOptional()
  @IsEnum(MarketingFunnelStage, { message: '无效的营销漏斗阶段' })
  readonly stage?: MarketingFunnelStage;
}

/**
 * 批量操作结果输出类型
 */
@ObjectType('BulkOperationResult')
export class BulkOperationResultDto {
  @Field({ description: '操作是否成功' })
  readonly success: boolean;

  @Field(() => Int, { description: '更新成功的记录数' })
  readonly updatedCount: number;

  @Field(() => [String], { description: '错误信息列表' })
  readonly errors: string[];
}