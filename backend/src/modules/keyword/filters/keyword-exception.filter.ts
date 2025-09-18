/**
 * 关键词异常过滤器
 * 
 * @description 处理关键词模块的异常，将其转换为适当的 HTTP 响应或 GraphQL 错误
 * @author AI Assistant
 * @version 1.0.0
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  HttpException,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { Response } from 'express';
import {
  BaseKeywordException,
  isKeywordException,
  formatKeywordError,
  formatErrorForLogging,
  formatGraphQLError,
} from '../exceptions/keyword.exceptions';

/**
 * 关键词异常过滤器
 * 同时处理 HTTP 和 GraphQL 异常
 */
@Catch()
export class KeywordExceptionFilter implements ExceptionFilter, GqlExceptionFilter {
  private readonly logger = new Logger(KeywordExceptionFilter.name);

  /**
   * 捕获异常
   */
  catch(exception: Error, host: ArgumentsHost): any {
    // 判断是 HTTP 还是 GraphQL 上下文
    if (host.getType() === 'http') {
      return this.handleHttpException(exception, host);
    } else {
      return this.handleGraphQLException(exception, host);
    }
  }

  /**
   * 处理 HTTP 异常
   */
  private handleHttpException(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // 记录异常日志
    this.logException(exception, {
      type: 'HTTP',
      url: request.url,
      method: request.method,
      userAgent: request.get('user-agent'),
      ip: request.ip,
    });

    // 处理关键词模块异常
    if (isKeywordException(exception)) {
      const errorResponse = formatKeywordError(exception);
      response.status(exception.getStatus()).json(errorResponse);
      return;
    }

    // 处理其他 HTTP 异常
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = {
        code: 'HTTP_ERROR',
        message: exception.message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
      response.status(status).json(errorResponse);
      return;
    }

    // 处理未知异常
    this.logger.error('未处理的异常', exception.stack);
    response.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: '内部服务器错误',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 处理 GraphQL 异常
   */
  private handleGraphQLException(exception: Error, host: ArgumentsHost): GraphQLError {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo();
    const context = gqlHost.getContext();

    // 记录异常日志
    this.logException(exception, {
      type: 'GraphQL',
      operation: info?.operation?.operation,
      fieldName: info?.fieldName,
      path: info?.path,
      userAgent: context?.req?.get('user-agent'),
      ip: context?.req?.ip,
    });

    // 使用专门的 GraphQL 错误格式化函数
    return formatGraphQLError(exception);
  }

  /**
   * 记录异常日志
   */
  private logException(exception: Error, context: Record<string, any>): void {
    const logLevel = this.getLogLevel(exception);
    const logMessage = this.formatLogMessage(exception, context);

    switch (logLevel) {
      case 'error':
        this.logger.error(logMessage, exception.stack);
        break;
      case 'warn':
        this.logger.warn(logMessage);
        break;
      case 'debug':
        this.logger.debug(logMessage);
        break;
      default:
        this.logger.log(logMessage);
    }
  }

  /**
   * 确定日志级别
   */
  private getLogLevel(exception: Error): 'error' | 'warn' | 'debug' | 'log' {
    // 关键词模块异常
    if (isKeywordException(exception)) {
      const status = exception.getStatus();
      
      if (status >= 500) {
        return 'error';
      } else if (status >= 400) {
        return 'warn';
      } else {
        return 'debug';
      }
    }

    // HTTP 异常
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      
      if (status >= 500) {
        return 'error';
      } else if (status >= 400) {
        return 'warn';
      } else {
        return 'debug';
      }
    }

    // 未知异常
    return 'error';
  }

  /**
   * 格式化日志消息
   */
  private formatLogMessage(exception: Error, context: Record<string, any>): string {
    const baseMessage = `${context.type} 异常: ${exception.message}`;
    const contextInfo = Object.entries(context)
      .filter(([key, value]) => key !== 'type' && value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');

    return contextInfo ? `${baseMessage} [${contextInfo}]` : baseMessage;
  }
}

/**
 * GraphQL 专用异常过滤器
 */
@Catch()
export class GraphQLKeywordExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLKeywordExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost): GraphQLError {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo();

    // 记录详细的 GraphQL 异常信息
    this.logger.error(
      `GraphQL 异常 in ${info?.fieldName}: ${exception.message}`,
      {
        operation: info?.operation?.operation,
        fieldName: info?.fieldName,
        path: info?.path,
        variables: info?.variableValues,
        stack: exception.stack,
      },
    );

    return formatGraphQLError(exception);
  }
}

/**
 * HTTP 专用异常过滤器
 */
@Catch(BaseKeywordException)
export class HttpKeywordExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpKeywordExceptionFilter.name);

  catch(exception: BaseKeywordException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // 记录异常
    const logData = formatErrorForLogging(exception, 'HTTP');
    this.logger.error(logData.message, logData);

    // 返回格式化的错误响应
    const errorResponse = formatKeywordError(exception);
    response.status(exception.getStatus()).json({
      ...errorResponse,
      path: request.url,
      method: request.method,
    });
  }
}