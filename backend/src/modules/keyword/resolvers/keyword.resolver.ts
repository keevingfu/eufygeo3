/**
 * 关键词 GraphQL 解析器
 * 
 * @description 实现关键词相关的 GraphQL 查询、变更和字段解析器
 * @author AI Assistant
 * @version 1.0.0
 */

import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
  Context,
  Int,
} from '@nestjs/graphql';
import {
  UseGuards,
  UseInterceptors,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { GraphQLResolveInfo } from 'graphql';
import { KeywordService } from '../services/keyword.service';
import { KeywordLoaderService } from '../loaders/keyword.loader';
import {
  KeywordDto,
  PaginatedKeywordsDto,
  CreateKeywordInputDto,
  UpdateKeywordInputDto,
  KeywordQueryInputDto,
  AIOMonitoringInputDto,
  BulkUpdateKeywordsInputDto,
  BulkOperationResultDto,
  AIOStatsDto,
  UserInfoDto,
  KeywordMetricDto,
  ContentItemInfoDto,
  TaskInfoDto,
} from '../dto/keyword.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { GraphQLFieldsInterceptor } from '@/common/interceptors/graphql-fields.interceptor';
import { User } from '@prisma/client';

/**
 * 当前用户接口
 */
interface CurrentUserInfo {
  id: string;
  email: string;
  roleId: string;
  permissions: string[];
}

/**
 * GraphQL 上下文接口
 */
interface GraphQLContext {
  req: {
    user: CurrentUserInfo;
  };
  loaders: KeywordLoaderService;
}

/**
 * 关键词 GraphQL 解析器
 */
@Resolver(() => KeywordDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(CacheInterceptor, GraphQLFieldsInterceptor)
export class KeywordResolver {
  private readonly logger = new Logger(KeywordResolver.name);

  constructor(
    private readonly keywordService: KeywordService,
    private readonly loaderService: KeywordLoaderService,
  ) {}

  // ==================== 查询解析器 ====================

  /**
   * 获取关键词详情
   */
  @Query(() => KeywordDto, { 
    name: 'keyword',
    description: '根据 ID 获取关键词详情' 
  })
  async getKeyword(
    @Args('id', { type: () => ID, description: '关键词 ID' }) id: string,
    @Context() context: GraphQLContext,
  ): Promise<KeywordDto> {
    this.logger.debug(`查询关键词详情: ${id}`);
    
    try {
      // 使用 DataLoader 加载关键词
      const keyword = await context.loaders.getKeywordLoader().load(id);
      
      if (!keyword) {
        throw new Error(`关键词不存在: ${id}`);
      }

      return keyword as KeywordDto;
    } catch (error) {
      this.logger.error(`查询关键词详情失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 查询关键词列表
   */
  @Query(() => PaginatedKeywordsDto, { 
    name: 'keywords',
    description: '查询关键词列表，支持过滤、排序和分页' 
  })
  async getKeywords(
    @Args('input', { 
      type: () => KeywordQueryInputDto, 
      nullable: true,
      description: '查询条件' 
    }) input?: KeywordQueryInputDto,
    @CurrentUser() user?: CurrentUserInfo,
  ): Promise<PaginatedKeywordsDto> {
    this.logger.debug(`查询关键词列表: ${JSON.stringify(input)}`);
    
    try {
      const options = {
        filters: input?.filters || {},
        sort: input?.sort || [{ field: 'createdAt' as const, direction: 'desc' as const }],
        pagination: input?.pagination || { page: 1, limit: 20 },
        includeRelations: {
          assignee: true,
          creator: true,
          metrics: false, // 列表查询不包含指标详情
          contentItems: false,
          tasks: false,
        },
      };

      const result = await this.keywordService.getKeywords(options);
      
      return {
        data: result.data as KeywordDto[],
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPreviousPage,
        },
      };
    } catch (error) {
      this.logger.error(`查询关键词列表失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 搜索关键词
   */
  @Query(() => [KeywordDto], { 
    name: 'searchKeywords',
    description: '根据文本搜索关键词' 
  })
  async searchKeywords(
    @Args('query', { description: '搜索关键词' }) query: string,
    @Args('limit', { 
      type: () => Int, 
      nullable: true, 
      defaultValue: 10,
      description: '返回结果数量限制' 
    }) limit?: number,
  ): Promise<KeywordDto[]> {
    this.logger.debug(`搜索关键词: ${query}`);
    
    try {
      const keywords = await this.keywordService.searchKeywords(query, limit);
      return keywords as KeywordDto[];
    } catch (error) {
      this.logger.error(`搜索关键词失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取 AIO 统计数据
   */
  @Query(() => AIOStatsDto, { 
    name: 'aioStats',
    description: '获取 AIO 覆盖统计数据' 
  })
  @Roles(['admin', 'manager', 'analyst'])
  async getAIOStats(): Promise<AIOStatsDto> {
    this.logger.debug('查询 AIO 统计数据');
    
    try {
      const stats = await this.keywordService.getAIOStats();
      
      return {
        totalMonitored: stats.totalMonitored,
        totalDisplayed: stats.totalDisplayed,
        displayRate: stats.displayRate,
        averagePosition: stats.averagePosition,
        p0Stats: stats.coverageByPriority.P0,
        p1Stats: stats.coverageByPriority.P1,
        p2Stats: stats.coverageByPriority.P2,
        p3Stats: stats.coverageByPriority.P3,
        p4Stats: stats.coverageByPriority.P4,
      };
    } catch (error) {
      this.logger.error(`查询 AIO 统计数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==================== 变更解析器 ====================

  /**
   * 创建关键词
   */
  @Mutation(() => KeywordDto, { 
    name: 'createKeyword',
    description: '创建新关键词' 
  })
  @Roles(['admin', 'manager', 'editor'])
  async createKeyword(
    @Args('input', { type: () => CreateKeywordInputDto }) input: CreateKeywordInputDto,
    @CurrentUser() user: CurrentUserInfo,
  ): Promise<KeywordDto> {
    this.logger.debug(`创建关键词: ${input.text}`);
    
    try {
      const keyword = await this.keywordService.createKeyword(input, user.id);
      
      // 清除相关缓存
      this.loaderService.clearAllCaches();
      
      return keyword as KeywordDto;
    } catch (error) {
      this.logger.error(`创建关键词失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新关键词
   */
  @Mutation(() => KeywordDto, { 
    name: 'updateKeyword',
    description: '更新关键词信息' 
  })
  @Roles(['admin', 'manager', 'editor'])
  async updateKeyword(
    @Args('input', { type: () => UpdateKeywordInputDto }) input: UpdateKeywordInputDto,
    @CurrentUser() user: CurrentUserInfo,
  ): Promise<KeywordDto> {
    this.logger.debug(`更新关键词: ${input.id}`);
    
    try {
      const keyword = await this.keywordService.updateKeyword(input, user.id);
      
      // 清除特定关键词的缓存
      this.loaderService.clearKeywordCache(input.id);
      
      return keyword as KeywordDto;
    } catch (error) {
      this.logger.error(`更新关键词失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 删除关键词
   */
  @Mutation(() => Boolean, { 
    name: 'deleteKeyword',
    description: '删除关键词' 
  })
  @Roles(['admin', 'manager'])
  async deleteKeyword(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserInfo,
  ): Promise<boolean> {
    this.logger.debug(`删除关键词: ${id}`);
    
    try {
      const result = await this.keywordService.deleteKeyword(id);
      
      // 清除特定关键词的缓存
      this.loaderService.clearKeywordCache(id);
      
      return result;
    } catch (error) {
      this.logger.error(`删除关键词失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 批量更新关键词
   */
  @Mutation(() => BulkOperationResultDto, { 
    name: 'bulkUpdateKeywords',
    description: '批量更新关键词' 
  })
  @Roles(['admin', 'manager'])
  async bulkUpdateKeywords(
    @Args('input', { type: () => BulkUpdateKeywordsInputDto }) input: BulkUpdateKeywordsInputDto,
    @CurrentUser() user: CurrentUserInfo,
  ): Promise<BulkOperationResultDto> {
    this.logger.debug(`批量更新关键词: ${input.keywordIds.length} 个`);
    
    try {
      const result = await this.keywordService.bulkUpdateKeywords(input);
      
      // 清除所有缓存
      this.loaderService.clearAllCaches();
      
      return result;
    } catch (error) {
      this.logger.error(`批量更新关键词失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 添加 AIO 监测数据
   */
  @Mutation(() => Boolean, { 
    name: 'addAIOMonitoring',
    description: '添加 AIO 监测数据' 
  })
  @Roles(['admin', 'manager', 'analyst'])
  async addAIOMonitoring(
    @Args('input', { type: () => AIOMonitoringInputDto }) input: AIOMonitoringInputDto,
    @CurrentUser() user: CurrentUserInfo,
  ): Promise<boolean> {
    this.logger.debug(`添加 AIO 监测数据: 关键词 ${input.keywordId}`);
    
    try {
      const result = await this.keywordService.addAIOMonitoring(input);
      
      // 清除特定关键词的缓存
      this.loaderService.clearKeywordCache(input.keywordId);
      
      return result;
    } catch (error) {
      this.logger.error(`添加 AIO 监测数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==================== 字段解析器 ====================

  /**
   * 解析分配用户字段
   */
  @ResolveField('assignee', () => UserInfoDto, { nullable: true })
  async resolveAssignee(
    @Parent() keyword: KeywordDto,
    @Context() context: GraphQLContext,
  ): Promise<UserInfoDto | null> {
    if (!keyword.assignedTo) {
      return null;
    }

    try {
      const user = await context.loaders.getUserLoader().load(keyword.assignedTo);
      return user ? {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
      } : null;
    } catch (error) {
      this.logger.error(`解析分配用户失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 解析创建者字段
   */
  @ResolveField('creator', () => UserInfoDto)
  async resolveCreator(
    @Parent() keyword: KeywordDto,
    @Context() context: GraphQLContext,
  ): Promise<UserInfoDto> {
    try {
      const user = await context.loaders.getUserLoader().load(keyword.createdBy);
      
      if (!user) {
        throw new Error(`创建者不存在: ${keyword.createdBy}`);
      }

      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
      };
    } catch (error) {
      this.logger.error(`解析创建者失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 解析关键词指标字段
   */
  @ResolveField('metrics', () => [KeywordMetricDto], { nullable: true })
  async resolveMetrics(
    @Parent() keyword: KeywordDto,
    @Context() context: GraphQLContext,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 30 }) limit?: number,
  ): Promise<KeywordMetricDto[]> {
    try {
      const metrics = await context.loaders.getKeywordMetricsLoader().load(keyword.id);
      
      // 应用限制
      return metrics.slice(0, limit || 30) as KeywordMetricDto[];
    } catch (error) {
      this.logger.error(`解析关键词指标失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 解析关联内容字段
   */
  @ResolveField('contentItems', () => [ContentItemInfoDto], { nullable: true })
  async resolveContentItems(
    @Parent() keyword: KeywordDto,
    @Context() context: GraphQLContext,
  ): Promise<ContentItemInfoDto[]> {
    try {
      const contentItems = await context.loaders.getKeywordContentItemsLoader().load(keyword.id);
      return contentItems as ContentItemInfoDto[];
    } catch (error) {
      this.logger.error(`解析关联内容失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 解析关联任务字段
   */
  @ResolveField('tasks', () => [TaskInfoDto], { nullable: true })
  async resolveTasks(
    @Parent() keyword: KeywordDto,
    @Context() context: GraphQLContext,
  ): Promise<TaskInfoDto[]> {
    try {
      const tasks = await context.loaders.getKeywordTasksLoader().load(keyword.id);
      return tasks as TaskInfoDto[];
    } catch (error) {
      this.logger.error(`解析关联任务失败: ${error.message}`, error.stack);
      return [];
    }
  }

  // ==================== 计算字段解析器 ====================

  /**
   * 解析最新排名位置
   */
  @ResolveField('latestPosition', () => Int, { 
    nullable: true,
    description: '最新 Google 排名位置' 
  })
  async resolveLatestPosition(
    @Parent() keyword: KeywordDto,
    @Context() context: GraphQLContext,
  ): Promise<number | null> {
    try {
      const latestMetric = await context.loaders.getLatestKeywordMetricsLoader().load(keyword.id);
      return latestMetric?.googlePosition || null;
    } catch (error) {
      this.logger.error(`解析最新排名位置失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 解析性能分数 (计算字段)
   */
  @ResolveField('performanceScore', () => Int, { 
    nullable: true,
    description: '综合性能分数 (0-100)' 
  })
  async resolvePerformanceScore(
    @Parent() keyword: KeywordDto,
    @Context() context: GraphQLContext,
  ): Promise<number | null> {
    try {
      const stats = await context.loaders.getKeywordStatsLoader().load(keyword.id);
      
      if (!stats || stats.totalMetrics === 0) {
        return null;
      }

      // 简化的性能分数计算
      let score = 50; // 基础分数

      // 根据最新排名调整分数
      if (stats.latestPosition) {
        if (stats.latestPosition <= 3) score += 30;
        else if (stats.latestPosition <= 10) score += 20;
        else if (stats.latestPosition <= 20) score += 10;
      }

      // 根据 AIO 显示情况调整分数
      if (stats.aioDisplayCount > 0) {
        score += 15;
      }

      // 根据流量调整分数
      if (stats.organicTrafficTotal > 1000) score += 10;
      else if (stats.organicTrafficTotal > 100) score += 5;

      return Math.min(100, Math.max(0, score));
    } catch (error) {
      this.logger.error(`解析性能分数失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 解析竞争强度 (计算字段)
   */
  @ResolveField('competitionIntensity', () => String, { 
    nullable: true,
    description: '竞争强度等级' 
  })
  async resolveCompetitionIntensity(
    @Parent() keyword: KeywordDto,
  ): Promise<string | null> {
    try {
      if (!keyword.difficulty || !keyword.searchVolume) {
        return null;
      }

      const difficulty = typeof keyword.difficulty === 'object' 
        ? parseFloat(keyword.difficulty.toString()) 
        : keyword.difficulty;

      // 综合难度和搜索量判断竞争强度
      if (difficulty > 80 && keyword.searchVolume > 10000) {
        return 'EXTREME';
      } else if (difficulty > 60 && keyword.searchVolume > 5000) {
        return 'HIGH';
      } else if (difficulty > 40 && keyword.searchVolume > 1000) {
        return 'MEDIUM';
      } else {
        return 'LOW';
      }
    } catch (error) {
      this.logger.error(`解析竞争强度失败: ${error.message}`, error.stack);
      return null;
    }
  }
}