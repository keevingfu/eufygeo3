/**
 * 关键词管理模块
 * 
 * @description NestJS 模块配置，整合所有关键词相关的服务、解析器和提供者
 * @author AI Assistant
 * @version 1.0.0
 */

import { Module, forwardRef } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// 核心服务
import { KeywordService } from './services/keyword.service';
import { KeywordLoaderService } from './loaders/keyword.loader';

// GraphQL 解析器
import { KeywordResolver } from './resolvers/keyword.resolver';

// 验证器
import {
  IsKeywordTextUniqueConstraint,
  IsUserExistsConstraint,
  IsKeywordExistsConstraint,
  IsSearchVolumeReasonableConstraint,
  IsCPCReasonableConstraint,
  IsKeywordTextValidConstraint,
  IsPriorityLevelCombinationValidConstraint,
  IsDateRangeValidConstraint,
} from './validators/keyword.validators';

// 异常过滤器
import { KeywordExceptionFilter } from './filters/keyword-exception.filter';

// 拦截器
import { KeywordLoggingInterceptor } from './interceptors/keyword-logging.interceptor';
import { KeywordCacheInterceptor } from './interceptors/keyword-cache.interceptor';

// 共享模块
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/modules/auth/auth.module';

/**
 * 关键词管理模块
 */
@Module({
  imports: [
    CommonModule,
    forwardRef(() => AuthModule), // 避免循环依赖
  ],
  providers: [
    // 核心服务
    KeywordService,
    KeywordLoaderService,

    // GraphQL 解析器
    KeywordResolver,

    // 自定义验证器
    IsKeywordTextUniqueConstraint,
    IsUserExistsConstraint,
    IsKeywordExistsConstraint,
    IsSearchVolumeReasonableConstraint,
    IsCPCReasonableConstraint,
    IsKeywordTextValidConstraint,
    IsPriorityLevelCombinationValidConstraint,
    IsDateRangeValidConstraint,

    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: KeywordExceptionFilter,
    },

    // 全局拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: KeywordLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: KeywordCacheInterceptor,
    },
  ],
  exports: [
    // 导出服务供其他模块使用
    KeywordService,
    KeywordLoaderService,

    // 导出验证器供其他模块使用
    IsKeywordTextUniqueConstraint,
    IsUserExistsConstraint,
    IsKeywordExistsConstraint,
  ],
})
export class KeywordModule {}