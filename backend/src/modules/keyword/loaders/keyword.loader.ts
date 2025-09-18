/**
 * 关键词数据加载器
 * 
 * @description 使用 DataLoader 解决 N+1 查询问题，提供高效的数据批量加载
 * @author AI Assistant
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '@/common/services/prisma.service';
import { Keyword, KeywordMetric, User, ContentItem, Task } from '@prisma/client';

/**
 * 关键词数据加载器服务
 */
@Injectable()
export class KeywordLoaderService {
  private readonly logger = new Logger(KeywordLoaderService.name);

  // DataLoader 实例缓存
  private readonly loaderCache = new Map<string, DataLoader<any, any>>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取关键词批量加载器
   */
  getKeywordLoader(): DataLoader<string, Keyword | null> {
    const cacheKey = 'keywords';
    
    if (!this.loaderCache.has(cacheKey)) {
      const loader = new DataLoader<string, Keyword | null>(
        async (keywordIds: readonly string[]) => {
          this.logger.debug(`批量加载关键词: ${keywordIds.length} 个`);
          
          try {
            const keywords = await this.prisma.keyword.findMany({
              where: {
                id: {
                  in: keywordIds as string[],
                },
              },
            });

            // 创建 ID 到关键词的映射
            const keywordMap = new Map(keywords.map(k => [k.id, k]));

            // 按原始顺序返回结果，缺失的返回 null
            return keywordIds.map(id => keywordMap.get(id) || null);
          } catch (error) {
            this.logger.error(`批量加载关键词失败: ${error.message}`, error.stack);
            return keywordIds.map(() => null);
          }
        },
        {
          cache: true,
          batchScheduleFn: callback => setTimeout(callback, 10), // 10ms 批处理延迟
          maxBatchSize: 100, // 最大批量大小
        },
      );

      this.loaderCache.set(cacheKey, loader);
    }

    return this.loaderCache.get(cacheKey);
  }

  /**
   * 获取用户批量加载器
   */
  getUserLoader(): DataLoader<string, User | null> {
    const cacheKey = 'users';
    
    if (!this.loaderCache.has(cacheKey)) {
      const loader = new DataLoader<string, User | null>(
        async (userIds: readonly string[]) => {
          this.logger.debug(`批量加载用户: ${userIds.length} 个`);
          
          try {
            const users = await this.prisma.user.findMany({
              where: {
                id: {
                  in: userIds as string[],
                },
              },
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            });

            const userMap = new Map(users.map(u => [u.id, u]));
            return userIds.map(id => userMap.get(id) || null);
          } catch (error) {
            this.logger.error(`批量加载用户失败: ${error.message}`, error.stack);
            return userIds.map(() => null);
          }
        },
        {
          cache: true,
          batchScheduleFn: callback => setTimeout(callback, 10),
          maxBatchSize: 100,
        },
      );

      this.loaderCache.set(cacheKey, loader);
    }

    return this.loaderCache.get(cacheKey);
  }

  /**
   * 获取关键词指标批量加载器
   */
  getKeywordMetricsLoader(): DataLoader<string, KeywordMetric[]> {
    const cacheKey = 'keyword-metrics';
    
    if (!this.loaderCache.has(cacheKey)) {
      const loader = new DataLoader<string, KeywordMetric[]>(
        async (keywordIds: readonly string[]) => {
          this.logger.debug(`批量加载关键词指标: ${keywordIds.length} 个关键词`);
          
          try {
            const metrics = await this.prisma.keywordMetric.findMany({
              where: {
                keywordId: {
                  in: keywordIds as string[],
                },
              },
              orderBy: {
                metricDate: 'desc',
              },
              take: 30, // 每个关键词最多返回 30 条最新指标
            });

            // 按关键词 ID 分组
            const metricsMap = new Map<string, KeywordMetric[]>();
            for (const metric of metrics) {
              if (!metricsMap.has(metric.keywordId)) {
                metricsMap.set(metric.keywordId, []);
              }
              metricsMap.get(metric.keywordId)!.push(metric);
            }

            return keywordIds.map(id => metricsMap.get(id) || []);
          } catch (error) {
            this.logger.error(`批量加载关键词指标失败: ${error.message}`, error.stack);
            return keywordIds.map(() => []);
          }
        },
        {
          cache: true,
          batchScheduleFn: callback => setTimeout(callback, 10),
          maxBatchSize: 50, // 指标数据量大，减少批量大小
        },
      );

      this.loaderCache.set(cacheKey, loader);
    }

    return this.loaderCache.get(cacheKey);
  }

  /**
   * 获取关键词最新指标批量加载器
   */
  getLatestKeywordMetricsLoader(): DataLoader<string, KeywordMetric | null> {
    const cacheKey = 'latest-keyword-metrics';
    
    if (!this.loaderCache.has(cacheKey)) {
      const loader = new DataLoader<string, KeywordMetric | null>(
        async (keywordIds: readonly string[]) => {
          this.logger.debug(`批量加载最新关键词指标: ${keywordIds.length} 个关键词`);
          
          try {
            // 使用子查询获取每个关键词的最新指标
            const metrics = await this.prisma.keywordMetric.findMany({
              where: {
                keywordId: {
                  in: keywordIds as string[],
                },
                metricDate: {
                  in: await this.prisma.keywordMetric.groupBy({
                    by: ['keywordId'],
                    where: {
                      keywordId: {
                        in: keywordIds as string[],
                      },
                    },
                    _max: {
                      metricDate: true,
                    },
                  }).then(results => 
                    results.map(r => r._max.metricDate).filter(Boolean) as Date[]
                  ),
                },
              },
            });

            const metricsMap = new Map(metrics.map(m => [m.keywordId, m]));
            return keywordIds.map(id => metricsMap.get(id) || null);
          } catch (error) {
            this.logger.error(`批量加载最新关键词指标失败: ${error.message}`, error.stack);
            return keywordIds.map(() => null);
          }
        },
        {
          cache: true,
          batchScheduleFn: callback => setTimeout(callback, 10),
          maxBatchSize: 100,
        },
      );

      this.loaderCache.set(cacheKey, loader);
    }

    return this.loaderCache.get(cacheKey);
  }

  /**
   * 获取关键词关联内容批量加载器
   */
  getKeywordContentItemsLoader(): DataLoader<string, ContentItem[]> {
    const cacheKey = 'keyword-content-items';
    
    if (!this.loaderCache.has(cacheKey)) {
      const loader = new DataLoader<string, ContentItem[]>(
        async (keywordIds: readonly string[]) => {
          this.logger.debug(`批量加载关键词关联内容: ${keywordIds.length} 个关键词`);
          
          try {
            // 查询关键词和内容的关联关系
            const relations = await this.prisma.keyword.findMany({
              where: {
                id: {
                  in: keywordIds as string[],
                },
              },
              select: {
                id: true,
                contentItems: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    contentType: true,
                    publishedAt: true,
                  },
                  take: 10, // 每个关键词最多返回 10 个关联内容
                  orderBy: {
                    createdAt: 'desc',
                  },
                },
              },
            });

            const contentMap = new Map(
              relations.map(r => [r.id, r.contentItems])
            );

            return keywordIds.map(id => contentMap.get(id) || []);
          } catch (error) {
            this.logger.error(`批量加载关键词关联内容失败: ${error.message}`, error.stack);
            return keywordIds.map(() => []);
          }
        },
        {
          cache: true,
          batchScheduleFn: callback => setTimeout(callback, 10),
          maxBatchSize: 50,
        },
      );

      this.loaderCache.set(cacheKey, loader);
    }

    return this.loaderCache.get(cacheKey);
  }

  /**
   * 获取关键词关联任务批量加载器
   */
  getKeywordTasksLoader(): DataLoader<string, Task[]> {
    const cacheKey = 'keyword-tasks';
    
    if (!this.loaderCache.has(cacheKey)) {
      const loader = new DataLoader<string, Task[]>(
        async (keywordIds: readonly string[]) => {
          this.logger.debug(`批量加载关键词关联任务: ${keywordIds.length} 个关键词`);
          
          try {
            const tasks = await this.prisma.task.findMany({
              where: {
                keywordId: {
                  in: keywordIds as string[],
                },
              },
              select: {
                id: true,
                keywordId: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            });

            const tasksMap = new Map<string, Task[]>();
            for (const task of tasks) {
              if (task.keywordId) {
                if (!tasksMap.has(task.keywordId)) {
                  tasksMap.set(task.keywordId, []);
                }
                tasksMap.get(task.keywordId)!.push(task);
              }
            }

            return keywordIds.map(id => tasksMap.get(id) || []);
          } catch (error) {
            this.logger.error(`批量加载关键词关联任务失败: ${error.message}`, error.stack);
            return keywordIds.map(() => []);
          }
        },
        {
          cache: true,
          batchScheduleFn: callback => setTimeout(callback, 10),
          maxBatchSize: 50,
        },
      );

      this.loaderCache.set(cacheKey, loader);
    }

    return this.loaderCache.get(cacheKey);
  }

  /**
   * 获取关键词统计数据批量加载器
   */
  getKeywordStatsLoader(): DataLoader<string, {
    totalMetrics: number;
    latestPosition: number | null;
    aioDisplayCount: number;
    organicTrafficTotal: number;
  }> {
    const cacheKey = 'keyword-stats';
    
    if (!this.loaderCache.has(cacheKey)) {
      const loader = new DataLoader<string, any>(
        async (keywordIds: readonly string[]) => {
          this.logger.debug(`批量加载关键词统计数据: ${keywordIds.length} 个关键词`);
          
          try {
            // 并行查询各种统计数据
            const [
              totalMetrics,
              latestPositions,
              aioDisplayCounts,
              trafficTotals,
            ] = await Promise.all([
              // 总指标数量
              this.prisma.keywordMetric.groupBy({
                by: ['keywordId'],
                where: {
                  keywordId: { in: keywordIds as string[] },
                },
                _count: { id: true },
              }),
              
              // 最新排名位置
              this.prisma.keywordMetric.findMany({
                where: {
                  keywordId: { in: keywordIds as string[] },
                  googlePosition: { not: null },
                },
                select: {
                  keywordId: true,
                  googlePosition: true,
                  metricDate: true,
                },
                orderBy: { metricDate: 'desc' },
                distinct: ['keywordId'],
              }),
              
              // AIO 显示次数
              this.prisma.keywordMetric.groupBy({
                by: ['keywordId'],
                where: {
                  keywordId: { in: keywordIds as string[] },
                  aioDisplayed: true,
                },
                _count: { id: true },
              }),
              
              // 总自然流量
              this.prisma.keywordMetric.groupBy({
                by: ['keywordId'],
                where: {
                  keywordId: { in: keywordIds as string[] },
                  organicTraffic: { not: null },
                },
                _sum: { organicTraffic: true },
              }),
            ]);

            // 创建映射
            const totalMetricsMap = new Map(
              totalMetrics.map(m => [m.keywordId, m._count.id])
            );
            const latestPositionsMap = new Map(
              latestPositions.map(p => [p.keywordId, p.googlePosition])
            );
            const aioDisplayCountsMap = new Map(
              aioDisplayCounts.map(a => [a.keywordId, a._count.id])
            );
            const trafficTotalsMap = new Map(
              trafficTotals.map(t => [t.keywordId, t._sum.organicTraffic || 0])
            );

            return keywordIds.map(id => ({
              totalMetrics: totalMetricsMap.get(id) || 0,
              latestPosition: latestPositionsMap.get(id) || null,
              aioDisplayCount: aioDisplayCountsMap.get(id) || 0,
              organicTrafficTotal: trafficTotalsMap.get(id) || 0,
            }));
          } catch (error) {
            this.logger.error(`批量加载关键词统计数据失败: ${error.message}`, error.stack);
            return keywordIds.map(() => ({
              totalMetrics: 0,
              latestPosition: null,
              aioDisplayCount: 0,
              organicTrafficTotal: 0,
            }));
          }
        },
        {
          cache: true,
          batchScheduleFn: callback => setTimeout(callback, 15), // 统计查询稍微延长批处理时间
          maxBatchSize: 30, // 统计查询复杂，减少批量大小
        },
      );

      this.loaderCache.set(cacheKey, loader);
    }

    return this.loaderCache.get(cacheKey);
  }

  /**
   * 清除所有缓存
   */
  clearAllCaches(): void {
    this.logger.debug('清除所有 DataLoader 缓存');
    
    for (const [key, loader] of this.loaderCache.entries()) {
      loader.clearAll();
    }
  }

  /**
   * 清除特定关键词的缓存
   */
  clearKeywordCache(keywordId: string): void {
    this.logger.debug(`清除关键词 ${keywordId} 的相关缓存`);
    
    const loaderKeys = [
      'keywords',
      'keyword-metrics',
      'latest-keyword-metrics',
      'keyword-content-items',
      'keyword-tasks',
      'keyword-stats',
    ];

    for (const key of loaderKeys) {
      const loader = this.loaderCache.get(key);
      if (loader) {
        loader.clear(keywordId);
      }
    }
  }

  /**
   * 预加载关键词及其关联数据
   */
  async primeKeywordData(keywordIds: string[]): Promise<void> {
    this.logger.debug(`预加载关键词数据: ${keywordIds.length} 个关键词`);
    
    try {
      // 并行预加载各种数据
      await Promise.all([
        this.getKeywordLoader().loadMany(keywordIds),
        this.getKeywordMetricsLoader().loadMany(keywordIds),
        this.getLatestKeywordMetricsLoader().loadMany(keywordIds),
        this.getKeywordStatsLoader().loadMany(keywordIds),
      ]);
      
      this.logger.debug('关键词数据预加载完成');
    } catch (error) {
      this.logger.error(`预加载关键词数据失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 获取 DataLoader 统计信息
   */
  getLoaderStats(): Record<string, { 
    cacheSize: number; 
    totalRequests: number; 
    cacheHitRate?: number; 
  }> {
    const stats: Record<string, any> = {};
    
    for (const [key, loader] of this.loaderCache.entries()) {
      // DataLoader 没有直接的统计 API，这里只返回基本信息
      stats[key] = {
        cacheSize: (loader as any)._cache?.size || 0,
        totalRequests: (loader as any)._requestCount || 0,
      };
    }
    
    return stats;
  }
}