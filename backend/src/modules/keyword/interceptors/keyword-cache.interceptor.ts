/**
 * 关键词缓存拦截器
 * 
 * @description 实现关键词数据的智能缓存策略，提高查询性能
 * @author AI Assistant
 * @version 1.0.0
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Cache } from 'cache-manager';
import crypto from 'crypto';

/**
 * 缓存策略配置
 */
interface CacheStrategy {
  ttl: number; // 缓存时间 (秒)
  maxSize: number; // 最大缓存大小
  compress: boolean; // 是否压缩
  tags: string[]; // 缓存标签
}

/**
 * 缓存键配置
 */
interface CacheKeyConfig {
  prefix: string;
  includeUserId: boolean;
  includeParams: boolean;
  excludeFields: string[];
}

/**
 * 缓存元数据
 */
interface CacheMetadata {
  key: string;
  timestamp: number;
  ttl: number;
  size: number;
  hitCount: number;
  tags: string[];
}

/**
 * 关键词缓存拦截器
 */
@Injectable()
export class KeywordCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(KeywordCacheInterceptor.name);
  
  // 缓存策略映射
  private readonly cacheStrategies: Map<string, CacheStrategy> = new Map([
    // 读取操作 - 长时间缓存
    ['keyword', { ttl: 300, maxSize: 1024 * 1024, compress: true, tags: ['keyword'] }],
    ['keywords', { ttl: 60, maxSize: 5 * 1024 * 1024, compress: true, tags: ['keywords', 'list'] }],
    ['searchKeywords', { ttl: 120, maxSize: 1024 * 1024, compress: true, tags: ['search'] }],
    ['aioStats', { ttl: 600, maxSize: 512 * 1024, compress: false, tags: ['stats', 'aio'] }],
    
    // 用户相关查询 - 短时间缓存
    ['getUserKeywords', { ttl: 30, maxSize: 2 * 1024 * 1024, compress: true, tags: ['user', 'keywords'] }],
    
    // 复杂查询 - 中等时间缓存
    ['getKeywordMetrics', { ttl: 180, maxSize: 2 * 1024 * 1024, compress: true, tags: ['metrics'] }],
    ['getKeywordAnalytics', { ttl: 300, maxSize: 1024 * 1024, compress: true, tags: ['analytics'] }],
  ]);

  // 无需缓存的操作
  private readonly noCacheOperations = new Set([
    'createKeyword',
    'updateKeyword',
    'deleteKeyword',
    'bulkUpdateKeywords',
    'addAIOMonitoring',
  ]);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const contextInfo = this.extractContextInfo(context);
    
    // 检查是否需要缓存
    if (!this.shouldCache(contextInfo.operationName)) {
      return next.handle().pipe(
        tap(() => {
          // 变更操作后清除相关缓存
          this.invalidateRelatedCaches(contextInfo.operationName);
        }),
      );
    }

    // 生成缓存键
    const cacheKey = this.generateCacheKey(contextInfo);
    const strategy = this.getCacheStrategy(contextInfo.operationName);

    try {
      // 尝试从缓存获取数据
      const cachedResult = await this.getCachedResult(cacheKey);
      
      if (cachedResult !== null) {
        this.logger.debug(`缓存命中: ${cacheKey}`);
        await this.updateCacheHitCount(cacheKey);
        return of(cachedResult.data);
      }

      // 缓存未命中，执行原始操作
      this.logger.debug(`缓存未命中: ${cacheKey}`);
      
      return next.handle().pipe(
        tap(async (result) => {
          // 缓存结果
          await this.cacheResult(cacheKey, result, strategy);
        }),
      );
    } catch (error) {
      this.logger.error(`缓存操作失败: ${error.message}`, error.stack);
      // 缓存失败时直接执行原始操作
      return next.handle();
    }
  }

  /**
   * 提取上下文信息
   */
  private extractContextInfo(context: ExecutionContext): {
    operationName: string;
    args: any;
    userId?: string;
    contextType: 'http' | 'graphql';
  } {
    const contextType = context.getType<'http' | 'graphql'>();

    if (contextType === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      const args = gqlContext.getArgs();
      const request = gqlContext.getContext().req;
      
      return {
        operationName: info.fieldName,
        args,
        userId: request?.user?.id,
        contextType: 'graphql',
      };
    } else {
      const request = context.switchToHttp().getRequest();
      
      return {
        operationName: `${request.method}_${request.route?.path}`,
        args: { ...request.params, ...request.query, ...request.body },
        userId: request.user?.id,
        contextType: 'http',
      };
    }
  }

  /**
   * 检查是否应该缓存
   */
  private shouldCache(operationName: string): boolean {
    // 变更操作不缓存
    if (this.noCacheOperations.has(operationName)) {
      return false;
    }

    // 检查是否有缓存策略
    return this.cacheStrategies.has(operationName);
  }

  /**
   * 获取缓存策略
   */
  private getCacheStrategy(operationName: string): CacheStrategy {
    return this.cacheStrategies.get(operationName) || {
      ttl: 60,
      maxSize: 1024 * 1024,
      compress: true,
      tags: ['default'],
    };
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(contextInfo: {
    operationName: string;
    args: any;
    userId?: string;
  }): string {
    const keyConfig = this.getCacheKeyConfig(contextInfo.operationName);
    
    // 构建键的组成部分
    const keyParts = [keyConfig.prefix];
    
    // 添加操作名称
    keyParts.push(contextInfo.operationName);
    
    // 添加用户 ID
    if (keyConfig.includeUserId && contextInfo.userId) {
      keyParts.push(`user:${contextInfo.userId}`);
    }
    
    // 添加参数
    if (keyConfig.includeParams) {
      const filteredArgs = this.filterArgs(contextInfo.args, keyConfig.excludeFields);
      const argsHash = this.hashObject(filteredArgs);
      keyParts.push(`args:${argsHash}`);
    }
    
    return keyParts.join(':');
  }

  /**
   * 获取缓存键配置
   */
  private getCacheKeyConfig(operationName: string): CacheKeyConfig {
    const configs: Record<string, CacheKeyConfig> = {
      keyword: {
        prefix: 'kw',
        includeUserId: false,
        includeParams: true,
        excludeFields: [],
      },
      keywords: {
        prefix: 'kws',
        includeUserId: true,
        includeParams: true,
        excludeFields: ['limit', 'offset'],
      },
      searchKeywords: {
        prefix: 'search',
        includeUserId: false,
        includeParams: true,
        excludeFields: [],
      },
      aioStats: {
        prefix: 'aio_stats',
        includeUserId: false,
        includeParams: false,
        excludeFields: [],
      },
    };

    return configs[operationName] || {
      prefix: 'kw_default',
      includeUserId: true,
      includeParams: true,
      excludeFields: [],
    };
  }

  /**
   * 过滤参数
   */
  private filterArgs(args: any, excludeFields: string[]): any {
    if (!args || typeof args !== 'object') {
      return args;
    }

    const filtered = { ...args };
    
    // 移除排除的字段
    excludeFields.forEach(field => {
      delete filtered[field];
    });

    // 移除函数和 undefined 值
    Object.keys(filtered).forEach(key => {
      if (typeof filtered[key] === 'function' || filtered[key] === undefined) {
        delete filtered[key];
      }
    });

    return filtered;
  }

  /**
   * 对象哈希
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  /**
   * 获取缓存结果
   */
  private async getCachedResult(cacheKey: string): Promise<{
    data: any;
    metadata: CacheMetadata;
  } | null> {
    try {
      const cached = await this.cacheManager.get<string>(cacheKey);
      
      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached);
      
      // 检查是否过期
      if (parsed.metadata.timestamp + parsed.metadata.ttl * 1000 < Date.now()) {
        await this.cacheManager.del(cacheKey);
        return null;
      }

      return parsed;
    } catch (error) {
      this.logger.error(`获取缓存失败: ${cacheKey}`, error.stack);
      return null;
    }
  }

  /**
   * 缓存结果
   */
  private async cacheResult(
    cacheKey: string,
    data: any,
    strategy: CacheStrategy,
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      
      // 检查数据大小
      if (serialized.length > strategy.maxSize) {
        this.logger.warn(`数据过大，跳过缓存: ${cacheKey} (${serialized.length} bytes)`);
        return;
      }

      const cacheData = {
        data,
        metadata: {
          key: cacheKey,
          timestamp: Date.now(),
          ttl: strategy.ttl,
          size: serialized.length,
          hitCount: 0,
          tags: strategy.tags,
        },
      };

      await this.cacheManager.set(
        cacheKey,
        JSON.stringify(cacheData),
        strategy.ttl * 1000, // 转换为毫秒
      );

      this.logger.debug(
        `缓存已设置: ${cacheKey} (${serialized.length} bytes, TTL: ${strategy.ttl}s)`,
      );
    } catch (error) {
      this.logger.error(`设置缓存失败: ${cacheKey}`, error.stack);
    }
  }

  /**
   * 更新缓存命中次数
   */
  private async updateCacheHitCount(cacheKey: string): Promise<void> {
    try {
      const cached = await this.cacheManager.get<string>(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.metadata.hitCount += 1;
        
        await this.cacheManager.set(
          cacheKey,
          JSON.stringify(parsed),
          (parsed.metadata.timestamp + parsed.metadata.ttl * 1000 - Date.now()),
        );
      }
    } catch (error) {
      // 忽略更新命中次数的错误
      this.logger.debug(`更新缓存命中次数失败: ${cacheKey}`);
    }
  }

  /**
   * 使相关缓存失效
   */
  private async invalidateRelatedCaches(operationName: string): Promise<void> {
    try {
      const invalidationMap: Record<string, string[]> = {
        createKeyword: ['kws:', 'search:', 'aio_stats:', 'user:'],
        updateKeyword: ['kw:', 'kws:', 'search:', 'metrics:', 'user:'],
        deleteKeyword: ['kw:', 'kws:', 'search:', 'aio_stats:', 'user:'],
        bulkUpdateKeywords: ['kws:', 'search:', 'metrics:', 'user:'],
        addAIOMonitoring: ['aio_stats:', 'metrics:'],
      };

      const prefixes = invalidationMap[operationName];
      
      if (prefixes) {
        // 这里应该实现根据前缀删除缓存的逻辑
        // 由于 cache-manager 没有直接的前缀删除功能，
        // 实际实现中可能需要使用 Redis 的 SCAN + DEL 命令
        this.logger.debug(`使缓存失效: ${operationName} -> ${prefixes.join(', ')}`);
        
        // 简化实现：直接清除所有缓存（生产环境中应该实现更精确的失效策略）
        if (prefixes.length > 0) {
          await this.cacheManager.reset();
        }
      }
    } catch (error) {
      this.logger.error(`使缓存失效失败: ${operationName}`, error.stack);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    totalSize: number;
    hitRate: number;
    topKeys: Array<{ key: string; hits: number; size: number }>;
  }> {
    try {
      // 这里需要根据实际的缓存实现来获取统计信息
      // 简化实现
      return {
        totalKeys: 0,
        totalSize: 0,
        hitRate: 0,
        topKeys: [],
      };
    } catch (error) {
      this.logger.error('获取缓存统计失败', error.stack);
      return {
        totalKeys: 0,
        totalSize: 0,
        hitRate: 0,
        topKeys: [],
      };
    }
  }

  /**
   * 清除所有关键词相关缓存
   */
  async clearKeywordCaches(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.log('关键词缓存已清除');
    } catch (error) {
      this.logger.error('清除关键词缓存失败', error.stack);
    }
  }
}