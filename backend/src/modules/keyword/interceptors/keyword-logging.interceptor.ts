/**
 * 关键词日志拦截器
 * 
 * @description 记录关键词模块的操作日志，包括性能监控和审计日志
 * @author AI Assistant
 * @version 1.0.0
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * 操作类型枚举
 */
enum OperationType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  BULK_UPDATE = 'BULK_UPDATE',
  SEARCH = 'SEARCH',
  AIO_MONITORING = 'AIO_MONITORING',
}

/**
 * 日志级别枚举
 */
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * 审计日志接口
 */
interface AuditLog {
  timestamp: string;
  operationType: OperationType;
  operationName: string;
  userId?: string;
  userEmail?: string;
  resourceId?: string;
  resourceType: 'keyword' | 'keyword_metric' | 'bulk_operation';
  inputData?: any;
  outputData?: any;
  duration: number;
  success: boolean;
  error?: string;
  clientInfo: {
    ip?: string;
    userAgent?: string;
    referer?: string;
  };
  context: 'HTTP' | 'GraphQL';
  correlationId?: string;
}

/**
 * 性能指标接口
 */
interface PerformanceMetrics {
  operationName: string;
  duration: number;
  timestamp: string;
  success: boolean;
  inputSize?: number;
  outputSize?: number;
  cacheHit?: boolean;
  dbQueries?: number;
}

/**
 * 关键词日志拦截器
 */
@Injectable()
export class KeywordLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(KeywordLoggingInterceptor.name);
  private readonly auditLogger = new Logger('KeywordAudit');
  private readonly performanceLogger = new Logger('KeywordPerformance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    // 获取执行上下文信息
    const contextInfo = this.extractContextInfo(context);
    const operationType = this.determineOperationType(contextInfo.operationName);

    // 记录操作开始
    this.logOperationStart(contextInfo, correlationId);

    return next.handle().pipe(
      tap((result) => {
        const duration = Date.now() - startTime;
        
        // 记录成功的审计日志
        this.logAuditEvent({
          ...contextInfo,
          operationType,
          duration,
          success: true,
          outputData: this.sanitizeOutputData(result),
          correlationId,
        });

        // 记录性能指标
        this.logPerformanceMetrics({
          operationName: contextInfo.operationName,
          duration,
          success: true,
          inputSize: this.calculateDataSize(contextInfo.inputData),
          outputSize: this.calculateDataSize(result),
          timestamp: new Date().toISOString(),
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // 记录失败的审计日志
        this.logAuditEvent({
          ...contextInfo,
          operationType,
          duration,
          success: false,
          error: error.message,
          correlationId,
        });

        // 记录性能指标
        this.logPerformanceMetrics({
          operationName: contextInfo.operationName,
          duration,
          success: false,
          timestamp: new Date().toISOString(),
        });

        throw error;
      }),
    );
  }

  /**
   * 提取上下文信息
   */
  private extractContextInfo(context: ExecutionContext): Partial<AuditLog> {
    const contextType = context.getType<'http' | 'graphql'>();

    if (contextType === 'http') {
      return this.extractHttpContextInfo(context);
    } else {
      return this.extractGraphQLContextInfo(context);
    }
  }

  /**
   * 提取 HTTP 上下文信息
   */
  private extractHttpContextInfo(context: ExecutionContext): Partial<AuditLog> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    return {
      context: 'HTTP',
      operationName: `${request.method} ${request.route?.path || request.url}`,
      userId: user?.id,
      userEmail: user?.email,
      inputData: this.sanitizeInputData({
        body: request.body,
        query: request.query,
        params: request.params,
      }),
      clientInfo: {
        ip: request.ip,
        userAgent: request.get('user-agent'),
        referer: request.get('referer'),
      },
      resourceType: 'keyword',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 提取 GraphQL 上下文信息
   */
  private extractGraphQLContextInfo(context: ExecutionContext): Partial<AuditLog> {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const request = gqlContext.getContext().req;
    const args = gqlContext.getArgs();
    const user = request?.user;

    // 提取资源 ID
    const resourceId = this.extractResourceId(args);

    return {
      context: 'GraphQL',
      operationName: info.fieldName,
      userId: user?.id,
      userEmail: user?.email,
      resourceId,
      inputData: this.sanitizeInputData(args),
      clientInfo: {
        ip: request?.ip,
        userAgent: request?.get('user-agent'),
        referer: request?.get('referer'),
      },
      resourceType: this.determineResourceType(info.fieldName),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 确定操作类型
   */
  private determineOperationType(operationName: string): OperationType {
    const name = operationName.toLowerCase();

    if (name.includes('create')) return OperationType.CREATE;
    if (name.includes('update') && name.includes('bulk')) return OperationType.BULK_UPDATE;
    if (name.includes('update')) return OperationType.UPDATE;
    if (name.includes('delete')) return OperationType.DELETE;
    if (name.includes('search')) return OperationType.SEARCH;
    if (name.includes('aio')) return OperationType.AIO_MONITORING;
    
    return OperationType.READ;
  }

  /**
   * 确定资源类型
   */
  private determineResourceType(operationName: string): 'keyword' | 'keyword_metric' | 'bulk_operation' {
    const name = operationName.toLowerCase();

    if (name.includes('metric')) return 'keyword_metric';
    if (name.includes('bulk')) return 'bulk_operation';
    
    return 'keyword';
  }

  /**
   * 提取资源 ID
   */
  private extractResourceId(args: any): string | undefined {
    if (args.id) return args.id;
    if (args.input?.id) return args.input.id;
    if (args.input?.keywordId) return args.input.keywordId;
    if (args.input?.keywordIds) return args.input.keywordIds.join(',');
    
    return undefined;
  }

  /**
   * 记录操作开始
   */
  private logOperationStart(contextInfo: Partial<AuditLog>, correlationId: string): void {
    this.logger.debug(
      `开始操作: ${contextInfo.operationName} [${correlationId}]`,
      {
        operationName: contextInfo.operationName,
        userId: contextInfo.userId,
        resourceId: contextInfo.resourceId,
        correlationId,
      },
    );
  }

  /**
   * 记录审计事件
   */
  private logAuditEvent(auditLog: AuditLog): void {
    const logLevel = this.determineLogLevel(auditLog);
    const message = this.formatAuditMessage(auditLog);

    switch (logLevel) {
      case LogLevel.ERROR:
        this.auditLogger.error(message, auditLog);
        break;
      case LogLevel.WARN:
        this.auditLogger.warn(message, auditLog);
        break;
      case LogLevel.INFO:
        this.auditLogger.log(message, auditLog);
        break;
      case LogLevel.DEBUG:
        this.auditLogger.debug(message, auditLog);
        break;
    }
  }

  /**
   * 记录性能指标
   */
  private logPerformanceMetrics(metrics: PerformanceMetrics): void {
    const message = `性能指标: ${metrics.operationName} 耗时 ${metrics.duration}ms`;
    
    // 性能告警阈值
    if (metrics.duration > 5000) { // 5秒
      this.performanceLogger.error(`${message} - 严重性能问题`, metrics);
    } else if (metrics.duration > 2000) { // 2秒
      this.performanceLogger.warn(`${message} - 性能告警`, metrics);
    } else if (metrics.duration > 1000) { // 1秒
      this.performanceLogger.log(`${message} - 性能关注`, metrics);
    } else {
      this.performanceLogger.debug(message, metrics);
    }
  }

  /**
   * 确定日志级别
   */
  private determineLogLevel(auditLog: AuditLog): LogLevel {
    if (!auditLog.success) {
      return LogLevel.ERROR;
    }

    // 敏感操作使用 INFO 级别
    if ([
      OperationType.CREATE,
      OperationType.UPDATE,
      OperationType.DELETE,
      OperationType.BULK_UPDATE,
    ].includes(auditLog.operationType)) {
      return LogLevel.INFO;
    }

    // 查询操作使用 DEBUG 级别
    return LogLevel.DEBUG;
  }

  /**
   * 格式化审计消息
   */
  private formatAuditMessage(auditLog: AuditLog): string {
    const status = auditLog.success ? '成功' : '失败';
    const user = auditLog.userEmail || auditLog.userId || 'unknown';
    const resource = auditLog.resourceId ? ` [${auditLog.resourceId}]` : '';
    
    return `${auditLog.operationType} ${status}: ${user} 执行 ${auditLog.operationName}${resource} (${auditLog.duration}ms)`;
  }

  /**
   * 清理敏感输入数据
   */
  private sanitizeInputData(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };
    
    // 移除敏感字段
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // 限制数据大小
    return this.truncateData(sanitized, 1000);
  }

  /**
   * 清理敏感输出数据
   */
  private sanitizeOutputData(data: any): any {
    if (!data) return data;

    // 对于大型结果集，只记录摘要信息
    if (Array.isArray(data) && data.length > 10) {
      return {
        type: 'array',
        length: data.length,
        sample: data.slice(0, 3),
      };
    }

    // 限制数据大小
    return this.truncateData(data, 500);
  }

  /**
   * 截断数据
   */
  private truncateData(data: any, maxLength: number): any {
    const jsonString = JSON.stringify(data);
    
    if (jsonString.length <= maxLength) {
      return data;
    }

    const truncated = jsonString.substring(0, maxLength);
    
    try {
      return JSON.parse(truncated + '...');
    } catch {
      return `[TRUNCATED] ${truncated}...`;
    }
  }

  /**
   * 计算数据大小
   */
  private calculateDataSize(data: any): number {
    if (!data) return 0;
    
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  /**
   * 生成关联 ID
   */
  private generateCorrelationId(): string {
    return `kw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}