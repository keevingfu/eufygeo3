/**
 * 关键词管理服务
 * 
 * @description 实现关键词的 CRUD 操作、业务逻辑和数据处理
 * @author AI Assistant
 * @version 1.0.0
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { Prisma } from '@prisma/client';
import {
  KeywordWithRelations,
  CreateKeywordInput,
  UpdateKeywordInput,
  KeywordQueryOptions,
  PaginatedKeywords,
  KeywordFilters,
  BulkUpdateKeywordsInput,
  BulkOperationResult,
  AIOMonitoringInput,
  AIOStats,
  KeywordPriorityLevel,
  KeywordStatus,
  AIOStatus,
  KeywordErrorCode,
} from '../types/keyword.types';

/**
 * 关键词服务类
 */
@Injectable()
export class KeywordService {
  private readonly logger = new Logger(KeywordService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== 基础 CRUD 操作 ====================

  /**
   * 创建关键词
   */
  async createKeyword(
    input: CreateKeywordInput,
    createdBy: string,
  ): Promise<KeywordWithRelations> {
    try {
      // 检查关键词是否已存在
      const existingKeyword = await this.prisma.keyword.findFirst({
        where: {
          text: {
            equals: input.text.trim(),
            mode: 'insensitive',
          },
        },
      });

      if (existingKeyword) {
        throw new ConflictException({
          code: KeywordErrorCode.KEYWORD_ALREADY_EXISTS,
          message: `关键词 "${input.text}" 已存在`,
          details: { existingKeywordId: existingKeyword.id },
        });
      }

      // 验证分配用户是否存在
      if (input.assignedTo) {
        const assignee = await this.prisma.user.findUnique({
          where: { id: input.assignedTo },
        });

        if (!assignee) {
          throw new NotFoundException({
            code: KeywordErrorCode.ASSIGNEE_NOT_FOUND,
            message: `分配用户不存在: ${input.assignedTo}`,
          });
        }
      }

      // 创建关键词
      const keyword = await this.prisma.keyword.create({
        data: {
          text: input.text.trim(),
          searchVolume: input.searchVolume,
          difficulty: input.difficulty ? new Prisma.Decimal(input.difficulty) : null,
          cpc: input.cpc ? new Prisma.Decimal(input.cpc) : null,
          competitionLevel: input.competitionLevel,
          priorityLevel: input.priorityLevel,
          intentType: input.intentType,
          productLine: input.productLine,
          stage: input.stage,
          assignedTo: input.assignedTo,
          createdBy,
          status: KeywordStatus.ACTIVE,
          aioStatus: AIOStatus.NOT_MONITORED,
        },
        include: this.getDefaultInclude(),
      });

      this.logger.log(`关键词创建成功: ${keyword.text} (ID: ${keyword.id})`);
      return keyword as KeywordWithRelations;
    } catch (error) {
      this.logger.error(`创建关键词失败: ${error.message}`, error.stack);
      
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException({
        code: KeywordErrorCode.DATABASE_ERROR,
        message: '创建关键词时发生错误',
        details: { originalError: error.message },
      });
    }
  }

  /**
   * 根据 ID 获取关键词
   */
  async getKeywordById(id: string): Promise<KeywordWithRelations> {
    try {
      const keyword = await this.prisma.keyword.findUnique({
        where: { id },
        include: this.getDefaultInclude(),
      });

      if (!keyword) {
        throw new NotFoundException({
          code: KeywordErrorCode.KEYWORD_NOT_FOUND,
          message: `关键词不存在: ${id}`,
        });
      }

      return keyword as KeywordWithRelations;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`获取关键词失败: ${error.message}`, error.stack);
      throw new BadRequestException({
        code: KeywordErrorCode.DATABASE_ERROR,
        message: '获取关键词时发生错误',
        details: { keywordId: id, originalError: error.message },
      });
    }
  }

  /**
   * 更新关键词
   */
  async updateKeyword(
    input: UpdateKeywordInput,
    updatedBy?: string,
  ): Promise<KeywordWithRelations> {
    try {
      // 检查关键词是否存在
      const existingKeyword = await this.prisma.keyword.findUnique({
        where: { id: input.id },
      });

      if (!existingKeyword) {
        throw new NotFoundException({
          code: KeywordErrorCode.KEYWORD_NOT_FOUND,
          message: `关键词不存在: ${input.id}`,
        });
      }

      // 如果更新文本，检查是否与其他关键词冲突
      if (input.text && input.text.trim() !== existingKeyword.text) {
        const duplicateKeyword = await this.prisma.keyword.findFirst({
          where: {
            text: {
              equals: input.text.trim(),
              mode: 'insensitive',
            },
            id: {
              not: input.id,
            },
          },
        });

        if (duplicateKeyword) {
          throw new ConflictException({
            code: KeywordErrorCode.KEYWORD_ALREADY_EXISTS,
            message: `关键词 "${input.text}" 已存在`,
            details: { existingKeywordId: duplicateKeyword.id },
          });
        }
      }

      // 验证分配用户是否存在
      if (input.assignedTo) {
        const assignee = await this.prisma.user.findUnique({
          where: { id: input.assignedTo },
        });

        if (!assignee) {
          throw new NotFoundException({
            code: KeywordErrorCode.ASSIGNEE_NOT_FOUND,
            message: `分配用户不存在: ${input.assignedTo}`,
          });
        }
      }

      // 构建更新数据
      const updateData: Prisma.KeywordUpdateInput = {};
      
      if (input.text !== undefined) updateData.text = input.text.trim();
      if (input.searchVolume !== undefined) updateData.searchVolume = input.searchVolume;
      if (input.difficulty !== undefined) {
        updateData.difficulty = input.difficulty ? new Prisma.Decimal(input.difficulty) : null;
      }
      if (input.cpc !== undefined) {
        updateData.cpc = input.cpc ? new Prisma.Decimal(input.cpc) : null;
      }
      if (input.competitionLevel !== undefined) updateData.competitionLevel = input.competitionLevel;
      if (input.priorityLevel !== undefined) updateData.priorityLevel = input.priorityLevel;
      if (input.intentType !== undefined) updateData.intentType = input.intentType;
      if (input.productLine !== undefined) updateData.productLine = input.productLine;
      if (input.stage !== undefined) updateData.stage = input.stage;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
      if (input.aioStatus !== undefined) updateData.aioStatus = input.aioStatus;
      if (input.aioCoverageScore !== undefined) {
        updateData.aioCoverageScore = input.aioCoverageScore ? new Prisma.Decimal(input.aioCoverageScore) : null;
      }

      // 更新关键词
      const keyword = await this.prisma.keyword.update({
        where: { id: input.id },
        data: updateData,
        include: this.getDefaultInclude(),
      });

      this.logger.log(`关键词更新成功: ${keyword.text} (ID: ${keyword.id})`);
      return keyword as KeywordWithRelations;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      
      this.logger.error(`更新关键词失败: ${error.message}`, error.stack);
      throw new BadRequestException({
        code: KeywordErrorCode.DATABASE_ERROR,
        message: '更新关键词时发生错误',
        details: { keywordId: input.id, originalError: error.message },
      });
    }
  }

  /**
   * 删除关键词
   */
  async deleteKeyword(id: string): Promise<boolean> {
    try {
      // 检查关键词是否存在
      const keyword = await this.prisma.keyword.findUnique({
        where: { id },
        include: {
          contentItems: true,
          tasks: true,
        },
      });

      if (!keyword) {
        throw new NotFoundException({
          code: KeywordErrorCode.KEYWORD_NOT_FOUND,
          message: `关键词不存在: ${id}`,
        });
      }

      // 检查是否有关联的内容或任务
      if (keyword.contentItems.length > 0 || keyword.tasks.length > 0) {
        throw new BadRequestException({
          code: KeywordErrorCode.VALIDATION_ERROR,
          message: '无法删除关键词：存在关联的内容或任务',
          details: {
            contentItemsCount: keyword.contentItems.length,
            tasksCount: keyword.tasks.length,
          },
        });
      }

      // 删除关键词（级联删除指标数据）
      await this.prisma.keyword.delete({
        where: { id },
      });

      this.logger.log(`关键词删除成功: ${keyword.text} (ID: ${id})`);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`删除关键词失败: ${error.message}`, error.stack);
      throw new BadRequestException({
        code: KeywordErrorCode.DATABASE_ERROR,
        message: '删除关键词时发生错误',
        details: { keywordId: id, originalError: error.message },
      });
    }
  }

  // ==================== 查询操作 ====================

  /**
   * 查询关键词列表
   */
  async getKeywords(options: KeywordQueryOptions = {}): Promise<PaginatedKeywords> {
    try {
      const {
        filters = {},
        sort = [{ field: 'createdAt', direction: 'desc' }],
        pagination = { page: 1, limit: 20 },
        includeRelations = {},
      } = options;

      // 构建 where 条件
      const where = this.buildWhereConditions(filters);

      // 构建 orderBy 条件
      const orderBy = this.buildOrderByConditions(sort);

      // 构建 include 条件
      const include = this.buildIncludeConditions(includeRelations);

      // 计算分页参数
      const page = pagination.page || 1;
      const limit = Math.min(pagination.limit || 20, 100); // 限制最大每页数量
      const offset = (page - 1) * limit;

      // 执行查询
      const [keywords, total] = await Promise.all([
        this.prisma.keyword.findMany({
          where,
          orderBy,
          include,
          skip: offset,
          take: limit,
        }),
        this.prisma.keyword.count({ where }),
      ]);

      // 计算分页信息
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        data: keywords as KeywordWithRelations[],
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    } catch (error) {
      this.logger.error(`查询关键词列表失败: ${error.message}`, error.stack);
      throw new BadRequestException({
        code: KeywordErrorCode.DATABASE_ERROR,
        message: '查询关键词时发生错误',
        details: { originalError: error.message },
      });
    }
  }

  /**
   * 搜索关键词
   */
  async searchKeywords(
    query: string,
    limit: number = 10,
  ): Promise<KeywordWithRelations[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const keywords = await this.prisma.keyword.findMany({
        where: {
          OR: [
            {
              text: {
                contains: query.trim(),
                mode: 'insensitive',
              },
            },
            {
              text: {
                search: query.trim().split(' ').join(' & '),
              },
            },
          ],
          status: KeywordStatus.ACTIVE,
        },
        include: this.getDefaultInclude(),
        take: Math.min(limit, 50),
        orderBy: [
          {
            priorityLevel: 'asc',
          },
          {
            searchVolume: 'desc',
          },
        ],
      });

      return keywords as KeywordWithRelations[];
    } catch (error) {
      this.logger.error(`搜索关键词失败: ${error.message}`, error.stack);
      throw new BadRequestException({
        code: KeywordErrorCode.DATABASE_ERROR,
        message: '搜索关键词时发生错误',
        details: { query, originalError: error.message },
      });
    }
  }

  // ==================== 批量操作 ====================

  /**
   * 批量更新关键词
   */
  async bulkUpdateKeywords(input: BulkUpdateKeywordsInput): Promise<BulkOperationResult> {
    const errors: Array<{ keywordId: string; error: string }> = [];
    let updatedCount = 0;

    try {
      // 验证关键词是否存在
      const existingKeywords = await this.prisma.keyword.findMany({
        where: {
          id: {
            in: input.keywordIds,
          },
        },
        select: { id: true },
      });

      const existingIds = new Set(existingKeywords.map(k => k.id));
      const missingIds = input.keywordIds.filter(id => !existingIds.has(id));

      // 记录不存在的关键词
      missingIds.forEach(id => {
        errors.push({
          keywordId: id,
          error: '关键词不存在',
        });
      });

      // 验证分配用户
      if (input.assignedTo) {
        const assignee = await this.prisma.user.findUnique({
          where: { id: input.assignedTo },
        });

        if (!assignee) {
          throw new NotFoundException({
            code: KeywordErrorCode.ASSIGNEE_NOT_FOUND,
            message: `分配用户不存在: ${input.assignedTo}`,
          });
        }
      }

      // 构建更新数据
      const updateData: Prisma.KeywordUpdateInput = {};
      if (input.priorityLevel !== undefined) updateData.priorityLevel = input.priorityLevel;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
      if (input.competitionLevel !== undefined) updateData.competitionLevel = input.competitionLevel;
      if (input.intentType !== undefined) updateData.intentType = input.intentType;
      if (input.productLine !== undefined) updateData.productLine = input.productLine;
      if (input.stage !== undefined) updateData.stage = input.stage;

      // 批量更新
      if (Object.keys(updateData).length > 0) {
        const result = await this.prisma.keyword.updateMany({
          where: {
            id: {
              in: Array.from(existingIds),
            },
          },
          data: updateData,
        });

        updatedCount = result.count;
      }

      this.logger.log(`批量更新关键词完成: 成功 ${updatedCount}，失败 ${errors.length}`);

      return {
        success: errors.length === 0,
        updatedCount,
        errors,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`批量更新关键词失败: ${error.message}`, error.stack);
      throw new BadRequestException({
        code: KeywordErrorCode.DATABASE_ERROR,
        message: '批量更新关键词时发生错误',
        details: { originalError: error.message },
      });
    }
  }

  // ==================== AIO 相关操作 ====================

  /**
   * 添加 AIO 监测数据
   */
  async addAIOMonitoring(input: AIOMonitoringInput): Promise<boolean> {
    try {
      // 检查关键词是否存在
      const keyword = await this.prisma.keyword.findUnique({
        where: { id: input.keywordId },
      });

      if (!keyword) {
        throw new NotFoundException({
          code: KeywordErrorCode.KEYWORD_NOT_FOUND,
          message: `关键词不存在: ${input.keywordId}`,
        });
      }

      // 添加或更新指标数据
      await this.prisma.keywordMetric.upsert({
        where: {
          keywordId_metricDate: {
            keywordId: input.keywordId,
            metricDate: input.metricDate,
          },
        },
        update: {
          aioDisplayed: input.aioDisplayed,
          aioPosition: input.aioPosition,
          aioContentSnippet: input.aioContentSnippet,
        },
        create: {
          keywordId: input.keywordId,
          metricDate: input.metricDate,
          aioDisplayed: input.aioDisplayed,
          aioPosition: input.aioPosition,
          aioContentSnippet: input.aioContentSnippet,
        },
      });

      // 更新关键词的 AIO 状态
      const newAIOStatus = input.aioDisplayed ? AIOStatus.DISPLAYED : AIOStatus.NOT_DISPLAYED;
      const updateData: Prisma.KeywordUpdateInput = {
        aioStatus: newAIOStatus,
      };

      // 如果是首次发现 AIO，记录时间
      if (input.aioDisplayed && keyword.aioStatus === AIOStatus.NOT_MONITORED) {
        updateData.aioFirstSeenAt = input.metricDate;
      }

      await this.prisma.keyword.update({
        where: { id: input.keywordId },
        data: updateData,
      });

      this.logger.log(`AIO 监测数据添加成功: 关键词 ${input.keywordId}, 日期 ${input.metricDate.toISOString()}`);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`添加 AIO 监测数据失败: ${error.message}`, error.stack);
      throw new BadRequestException({
        code: KeywordErrorCode.DATABASE_ERROR,
        message: '添加 AIO 监测数据时发生错误',
        details: { originalError: error.message },
      });
    }
  }

  /**
   * 获取 AIO 统计数据
   */
  async getAIOStats(): Promise<AIOStats> {
    try {
      // 获取总体统计
      const totalStats = await this.prisma.keyword.groupBy({
        by: ['aioStatus'],
        _count: {
          id: true,
        },
        where: {
          status: KeywordStatus.ACTIVE,
        },
      });

      // 按优先级统计
      const priorityStats = await this.prisma.keyword.groupBy({
        by: ['priorityLevel', 'aioStatus'],
        _count: {
          id: true,
        },
        where: {
          status: KeywordStatus.ACTIVE,
          priorityLevel: {
            not: null,
          },
        },
      });

      // 计算平均位置
      const avgPosition = await this.prisma.keywordMetric.aggregate({
        _avg: {
          aioPosition: true,
        },
        where: {
          aioDisplayed: true,
          aioPosition: {
            not: null,
          },
        },
      });

      // 处理总体统计
      const monitored = totalStats
        .filter(s => s.aioStatus !== AIOStatus.NOT_MONITORED)
        .reduce((sum, s) => sum + s._count.id, 0);
      
      const displayed = totalStats
        .filter(s => s.aioStatus === AIOStatus.DISPLAYED)
        .reduce((sum, s) => sum + s._count.id, 0);

      // 处理优先级统计
      const coverageByPriority = Object.values(KeywordPriorityLevel).reduce((acc, priority) => {
        const priorityMonitored = priorityStats
          .filter(s => s.priorityLevel === priority && s.aioStatus !== AIOStatus.NOT_MONITORED)
          .reduce((sum, s) => sum + s._count.id, 0);
        
        const priorityDisplayed = priorityStats
          .filter(s => s.priorityLevel === priority && s.aioStatus === AIOStatus.DISPLAYED)
          .reduce((sum, s) => sum + s._count.id, 0);

        acc[priority] = {
          monitored: priorityMonitored,
          displayed: priorityDisplayed,
          rate: priorityMonitored > 0 ? (priorityDisplayed / priorityMonitored) * 100 : 0,
        };

        return acc;
      }, {} as Record<KeywordPriorityLevel, { monitored: number; displayed: number; rate: number }>);

      return {
        totalMonitored: monitored,
        totalDisplayed: displayed,
        displayRate: monitored > 0 ? (displayed / monitored) * 100 : 0,
        averagePosition: avgPosition._avg.aioPosition || null,
        coverageByPriority,
      };
    } catch (error) {
      this.logger.error(`获取 AIO 统计数据失败: ${error.message}`, error.stack);
      throw new BadRequestException({
        code: KeywordErrorCode.DATABASE_ERROR,
        message: '获取 AIO 统计数据时发生错误',
        details: { originalError: error.message },
      });
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 获取默认包含的关联数据
   */
  private getDefaultInclude(): Prisma.KeywordInclude {
    return {
      assignee: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
      creator: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    };
  }

  /**
   * 构建查询条件
   */
  private buildWhereConditions(filters: KeywordFilters): Prisma.KeywordWhereInput {
    const where: Prisma.KeywordWhereInput = {};

    if (filters.text) {
      where.text = {
        contains: filters.text,
        mode: 'insensitive',
      };
    }

    if (filters.priorityLevel) {
      where.priorityLevel = Array.isArray(filters.priorityLevel)
        ? { in: filters.priorityLevel }
        : filters.priorityLevel;
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    }

    if (filters.competitionLevel) {
      where.competitionLevel = Array.isArray(filters.competitionLevel)
        ? { in: filters.competitionLevel }
        : filters.competitionLevel;
    }

    if (filters.intentType) {
      where.intentType = Array.isArray(filters.intentType)
        ? { in: filters.intentType }
        : filters.intentType;
    }

    if (filters.productLine) {
      where.productLine = Array.isArray(filters.productLine)
        ? { in: filters.productLine }
        : filters.productLine;
    }

    if (filters.stage) {
      where.stage = Array.isArray(filters.stage)
        ? { in: filters.stage }
        : filters.stage;
    }

    if (filters.aioStatus) {
      where.aioStatus = Array.isArray(filters.aioStatus)
        ? { in: filters.aioStatus }
        : filters.aioStatus;
    }

    if (filters.assignedTo) {
      where.assignedTo = Array.isArray(filters.assignedTo)
        ? { in: filters.assignedTo }
        : filters.assignedTo;
    }

    if (filters.createdBy) {
      where.createdBy = Array.isArray(filters.createdBy)
        ? { in: filters.createdBy }
        : filters.createdBy;
    }

    // 数值范围过滤
    if (filters.searchVolumeMin !== undefined || filters.searchVolumeMax !== undefined) {
      where.searchVolume = {};
      if (filters.searchVolumeMin !== undefined) {
        where.searchVolume.gte = filters.searchVolumeMin;
      }
      if (filters.searchVolumeMax !== undefined) {
        where.searchVolume.lte = filters.searchVolumeMax;
      }
    }

    if (filters.difficultyMin !== undefined || filters.difficultyMax !== undefined) {
      where.difficulty = {};
      if (filters.difficultyMin !== undefined) {
        where.difficulty.gte = new Prisma.Decimal(filters.difficultyMin);
      }
      if (filters.difficultyMax !== undefined) {
        where.difficulty.lte = new Prisma.Decimal(filters.difficultyMax);
      }
    }

    // 日期范围过滤
    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) {
        where.createdAt.gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        where.createdAt.lte = filters.createdBefore;
      }
    }

    return where;
  }

  /**
   * 构建排序条件
   */
  private buildOrderByConditions(
    sort: Array<{ field: string; direction: 'asc' | 'desc' }>,
  ): Prisma.KeywordOrderByWithRelationInput[] {
    return sort.map(s => ({
      [s.field]: s.direction,
    }));
  }

  /**
   * 构建包含关联数据条件
   */
  private buildIncludeConditions(includeRelations: any): Prisma.KeywordInclude {
    const include: Prisma.KeywordInclude = {
      assignee: includeRelations.assignee ? {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      } : false,
      creator: includeRelations.creator ? {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      } : false,
      metrics: includeRelations.metrics ? (
        typeof includeRelations.metrics === 'object' ? {
          take: includeRelations.metrics.limit || 30,
          orderBy: {
            metricDate: 'desc',
          },
        } : true
      ) : false,
      contentItems: includeRelations.contentItems ? {
        select: {
          id: true,
          title: true,
          status: true,
        },
      } : false,
      tasks: includeRelations.tasks ? {
        select: {
          id: true,
          title: true,
          status: true,
        },
      } : false,
    };

    return include;
  }
}