/**
 * 关键词模块异常定义
 * 
 * @description 定义关键词模块相关的异常类型和错误处理
 * @author AI Assistant
 * @version 1.0.0
 */

import {
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { KeywordErrorCode } from '../types/keyword.types';

/**
 * 基础关键词异常类
 */
export abstract class BaseKeywordException extends HttpException {
  constructor(
    public readonly code: KeywordErrorCode,
    message: string,
    status: HttpStatus,
    public readonly details?: Record<string, unknown>,
  ) {
    super(
      {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }

  /**
   * 转换为 GraphQL 错误
   */
  toGraphQLError(): GraphQLError {
    return new GraphQLError(this.message, {
      extensions: {
        code: this.code,
        details: this.details,
        timestamp: new Date().toISOString(),
        http: {
          status: this.getStatus(),
        },
      },
    });
  }
}

/**
 * 关键词未找到异常
 */
export class KeywordNotFoundException extends BaseKeywordException {
  constructor(keywordId: string, details?: Record<string, unknown>) {
    super(
      KeywordErrorCode.KEYWORD_NOT_FOUND,
      `关键词不存在: ${keywordId}`,
      HttpStatus.NOT_FOUND,
      { keywordId, ...details },
    );
  }
}

/**
 * 关键词已存在异常
 */
export class KeywordAlreadyExistsException extends BaseKeywordException {
  constructor(text: string, existingKeywordId?: string, details?: Record<string, unknown>) {
    super(
      KeywordErrorCode.KEYWORD_ALREADY_EXISTS,
      `关键词 "${text}" 已存在`,
      HttpStatus.CONFLICT,
      { text, existingKeywordId, ...details },
    );
  }
}

/**
 * 无效优先级异常
 */
export class InvalidPriorityLevelException extends BaseKeywordException {
  constructor(priorityLevel: string, details?: Record<string, unknown>) {
    super(
      KeywordErrorCode.INVALID_PRIORITY_LEVEL,
      `无效的优先级等级: ${priorityLevel}`,
      HttpStatus.BAD_REQUEST,
      { priorityLevel, ...details },
    );
  }
}

/**
 * 无效 AIO 状态异常
 */
export class InvalidAIOStatusException extends BaseKeywordException {
  constructor(aioStatus: string, details?: Record<string, unknown>) {
    super(
      KeywordErrorCode.INVALID_AIO_STATUS,
      `无效的 AIO 状态: ${aioStatus}`,
      HttpStatus.BAD_REQUEST,
      { aioStatus, ...details },
    );
  }
}

/**
 * 分配用户未找到异常
 */
export class AssigneeNotFoundException extends BaseKeywordException {
  constructor(userId: string, details?: Record<string, unknown>) {
    super(
      KeywordErrorCode.ASSIGNEE_NOT_FOUND,
      `分配用户不存在: ${userId}`,
      HttpStatus.NOT_FOUND,
      { userId, ...details },
    );
  }
}

/**
 * 权限拒绝异常
 */
export class KeywordPermissionDeniedException extends BaseKeywordException {
  constructor(action: string, userId: string, details?: Record<string, unknown>) {
    super(
      KeywordErrorCode.PERMISSION_DENIED,
      `用户 ${userId} 没有权限执行操作: ${action}`,
      HttpStatus.FORBIDDEN,
      { action, userId, ...details },
    );
  }
}

/**
 * 验证错误异常
 */
export class KeywordValidationException extends BaseKeywordException {
  constructor(
    validationErrors: Array<{ field: string; message: string }>,
    details?: Record<string, unknown>,
  ) {
    const message = `数据验证失败: ${validationErrors.map(e => `${e.field} - ${e.message}`).join('; ')}`;
    
    super(
      KeywordErrorCode.VALIDATION_ERROR,
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      { validationErrors, ...details },
    );
  }
}

/**
 * 数据库操作异常
 */
export class KeywordDatabaseException extends BaseKeywordException {
  constructor(operation: string, originalError?: Error, details?: Record<string, unknown>) {
    super(
      KeywordErrorCode.DATABASE_ERROR,
      `数据库操作失败: ${operation}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      { 
        operation, 
        originalError: originalError?.message,
        ...details 
      },
    );
  }
}

/**
 * 关键词业务逻辑异常
 */
export class KeywordBusinessLogicException extends BaseKeywordException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      KeywordErrorCode.VALIDATION_ERROR,
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      details,
    );
  }
}

/**
 * 批量操作异常
 */
export class BulkOperationException extends BaseKeywordException {
  constructor(
    operation: string,
    failedCount: number,
    totalCount: number,
    errors: Array<{ id: string; error: string }>,
    details?: Record<string, unknown>,
  ) {
    super(
      KeywordErrorCode.VALIDATION_ERROR,
      `批量操作 ${operation} 部分失败: ${failedCount}/${totalCount} 失败`,
      HttpStatus.UNPROCESSABLE_ENTITY,
      { operation, failedCount, totalCount, errors, ...details },
    );
  }
}

// ==================== 异常工厂函数 ====================

/**
 * 异常工厂类
 */
export class KeywordExceptionFactory {
  /**
   * 根据错误代码创建异常
   */
  static createException(
    code: KeywordErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): BaseKeywordException {
    switch (code) {
      case KeywordErrorCode.KEYWORD_NOT_FOUND:
        return new KeywordNotFoundException(details?.keywordId as string || '', details);
      
      case KeywordErrorCode.KEYWORD_ALREADY_EXISTS:
        return new KeywordAlreadyExistsException(
          details?.text as string || '',
          details?.existingKeywordId as string,
          details,
        );
      
      case KeywordErrorCode.INVALID_PRIORITY_LEVEL:
        return new InvalidPriorityLevelException(details?.priorityLevel as string || '', details);
      
      case KeywordErrorCode.INVALID_AIO_STATUS:
        return new InvalidAIOStatusException(details?.aioStatus as string || '', details);
      
      case KeywordErrorCode.ASSIGNEE_NOT_FOUND:
        return new AssigneeNotFoundException(details?.userId as string || '', details);
      
      case KeywordErrorCode.PERMISSION_DENIED:
        return new KeywordPermissionDeniedException(
          details?.action as string || '',
          details?.userId as string || '',
          details,
        );
      
      case KeywordErrorCode.VALIDATION_ERROR:
        if (details?.validationErrors) {
          return new KeywordValidationException(
            details.validationErrors as Array<{ field: string; message: string }>,
            details,
          );
        }
        return new KeywordBusinessLogicException(message, details);
      
      case KeywordErrorCode.DATABASE_ERROR:
        return new KeywordDatabaseException(
          details?.operation as string || 'unknown',
          details?.originalError as Error,
          details,
        );
      
      default:
        return new KeywordBusinessLogicException(message, details);
    }
  }

  /**
   * 从 Prisma 错误创建异常
   */
  static fromPrismaError(error: any, operation: string): BaseKeywordException {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'text') {
        return new KeywordAlreadyExistsException(
          error.meta?.target_value || 'unknown',
          undefined,
          { prismaError: error },
        );
      }
    }

    // P2025: Record not found
    if (error.code === 'P2025') {
      return new KeywordNotFoundException('unknown', { prismaError: error });
    }

    // P2003: Foreign key constraint violation
    if (error.code === 'P2003') {
      const field = error.meta?.field_name;
      if (field === 'assignedTo') {
        return new AssigneeNotFoundException(
          error.meta?.target_value || 'unknown',
          { prismaError: error },
        );
      }
    }

    // 其他数据库错误
    return new KeywordDatabaseException(operation, error, { prismaError: error });
  }

  /**
   * 从验证错误创建异常
   */
  static fromValidationErrors(
    validationErrors: Array<{ property: string; constraints: Record<string, string> }>,
  ): KeywordValidationException {
    const errors = validationErrors.map(error => ({
      field: error.property,
      message: Object.values(error.constraints).join(', '),
    }));

    return new KeywordValidationException(errors);
  }
}

// ==================== 错误处理工具函数 ====================

/**
 * 检查是否为关键词模块异常
 */
export function isKeywordException(error: any): error is BaseKeywordException {
  return error instanceof BaseKeywordException;
}

/**
 * 将异常转换为统一的错误响应格式
 */
export function formatKeywordError(error: BaseKeywordException) {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: new Date().toISOString(),
    status: error.getStatus(),
  };
}

/**
 * 记录异常日志的格式化函数
 */
export function formatErrorForLogging(error: BaseKeywordException, context?: string) {
  return {
    context: context || 'KeywordModule',
    code: error.code,
    message: error.message,
    details: error.details,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };
}

// ==================== 异常过滤器 ====================

/**
 * GraphQL 异常过滤器
 */
export function formatGraphQLError(error: any): GraphQLError {
  // 如果是关键词模块异常，转换为 GraphQL 错误
  if (isKeywordException(error)) {
    return error.toGraphQLError();
  }

  // 如果是其他已知的 NestJS 异常
  if (error instanceof HttpException) {
    return new GraphQLError(error.message, {
      extensions: {
        code: 'INTERNAL_ERROR',
        http: {
          status: error.getStatus(),
        },
        timestamp: new Date().toISOString(),
      },
    });
  }

  // 未知错误
  return new GraphQLError('内部服务器错误', {
    extensions: {
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
    },
  });
}