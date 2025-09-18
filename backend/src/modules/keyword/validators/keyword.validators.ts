/**
 * 关键词模块自定义验证器
 * 
 * @description 提供关键词业务逻辑相关的自定义验证规则
 * @author AI Assistant
 * @version 1.0.0
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  isUUID,
  isEnum,
  isString,
  isNumber,
  min,
  max,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import {
  KeywordPriorityLevel,
  KeywordCompetitionLevel,
  KeywordIntentType,
  ProductLine,
  MarketingFunnelStage,
  AIOStatus,
  KeywordStatus,
} from '../types/keyword.types';

// ==================== 约束验证器 ====================

/**
 * 关键词文本唯一性验证器
 */
@ValidatorConstraint({ name: 'IsKeywordTextUnique', async: true })
@Injectable()
export class IsKeywordTextUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(text: string, args: ValidationArguments): Promise<boolean> {
    if (!text || typeof text !== 'string') {
      return false;
    }

    try {
      // 获取排除的关键词 ID（用于更新时跳过自身）
      const excludeId = args.object['id'] || args.object['excludeId'];
      
      const existingKeyword = await this.prisma.keyword.findFirst({
        where: {
          text: {
            equals: text.trim(),
            mode: 'insensitive',
          },
          ...(excludeId && { id: { not: excludeId } }),
        },
        select: { id: true },
      });

      return !existingKeyword;
    } catch (error) {
      // 数据库错误时返回 false，让业务逻辑处理
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `关键词 "${args.value}" 已存在`;
  }
}

/**
 * 用户存在性验证器
 */
@ValidatorConstraint({ name: 'IsUserExists', async: true })
@Injectable()
export class IsUserExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(userId: string): Promise<boolean> {
    if (!userId || !isUUID(userId, 4)) {
      return false;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      return !!user;
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `用户不存在: ${args.value}`;
  }
}

/**
 * 关键词存在性验证器
 */
@ValidatorConstraint({ name: 'IsKeywordExists', async: true })
@Injectable()
export class IsKeywordExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(keywordId: string): Promise<boolean> {
    if (!keywordId || !isUUID(keywordId, 4)) {
      return false;
    }

    try {
      const keyword = await this.prisma.keyword.findUnique({
        where: { id: keywordId },
        select: { id: true },
      });

      return !!keyword;
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `关键词不存在: ${args.value}`;
  }
}

/**
 * 搜索量合理性验证器
 */
@ValidatorConstraint({ name: 'IsSearchVolumeReasonable' })
export class IsSearchVolumeReasonableConstraint implements ValidatorConstraintInterface {
  validate(searchVolume: number): boolean {
    if (!isNumber(searchVolume)) {
      return true; // 让其他验证器处理类型错误
    }

    // 搜索量应该在合理范围内
    return searchVolume >= 0 && searchVolume <= 10000000; // 最大 1000 万
  }

  defaultMessage(): string {
    return '搜索量超出合理范围 (0-10,000,000)';
  }
}

/**
 * CPC 合理性验证器
 */
@ValidatorConstraint({ name: 'IsCPCReasonable' })
export class IsCPCReasonableConstraint implements ValidatorConstraintInterface {
  validate(cpc: number): boolean {
    if (!isNumber(cpc)) {
      return true; // 让其他验证器处理类型错误
    }

    // CPC 应该在合理范围内
    return cpc >= 0 && cpc <= 1000; // 最大 $1000
  }

  defaultMessage(): string {
    return 'CPC 超出合理范围 ($0-$1000)';
  }
}

/**
 * 关键词文本格式验证器
 */
@ValidatorConstraint({ name: 'IsKeywordTextValid' })
export class IsKeywordTextValidConstraint implements ValidatorConstraintInterface {
  validate(text: string): boolean {
    if (!isString(text)) {
      return false;
    }

    const trimmedText = text.trim();
    
    // 检查长度
    if (trimmedText.length < 1 || trimmedText.length > 255) {
      return false;
    }

    // 检查是否包含禁用字符
    const forbiddenChars = /[<>{}[\]\\`~!@#$%^&*()+=|;:'".,?/]/;
    if (forbiddenChars.test(trimmedText)) {
      return false;
    }

    // 检查是否全是空格或特殊字符
    if (!/[a-zA-Z0-9]/.test(trimmedText)) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return '关键词文本格式无效（长度 1-255，不能包含特殊符号）';
  }
}

/**
 * 优先级组合验证器
 */
@ValidatorConstraint({ name: 'IsPriorityLevelCombinationValid' })
export class IsPriorityLevelCombinationValidConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    const { priorityLevel, competitionLevel, searchVolume } = args.object as any;

    // 如果没有设置优先级，跳过验证
    if (!priorityLevel) {
      return true;
    }

    // P0 级关键词应该有较高的搜索量
    if (priorityLevel === KeywordPriorityLevel.P0) {
      if (searchVolume && searchVolume < 1000) {
        return false;
      }
    }

    // P4 级关键词不应该有过高的竞争度
    if (priorityLevel === KeywordPriorityLevel.P4) {
      if (competitionLevel === KeywordCompetitionLevel.HIGH) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const { priorityLevel } = args.object as any;
    
    if (priorityLevel === KeywordPriorityLevel.P0) {
      return 'P0 级关键词应该具有较高的搜索量 (≥1000)';
    }
    
    if (priorityLevel === KeywordPriorityLevel.P4) {
      return 'P4 级关键词不应该设置为高竞争度';
    }
    
    return '优先级和其他属性组合不合理';
  }
}

/**
 * 日期范围验证器
 */
@ValidatorConstraint({ name: 'IsDateRangeValid' })
export class IsDateRangeValidConstraint implements ValidatorConstraintInterface {
  validate(endDate: Date, args: ValidationArguments): boolean {
    const startDate = (args.object as any).createdAfter || (args.object as any).startDate;
    
    if (!startDate || !endDate) {
      return true; // 如果没有设置范围，跳过验证
    }

    return new Date(endDate) >= new Date(startDate);
  }

  defaultMessage(): string {
    return '结束日期必须晚于或等于开始日期';
  }
}

// ==================== 装饰器函数 ====================

/**
 * 关键词文本唯一性验证装饰器
 */
export function IsKeywordTextUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsKeywordTextUniqueConstraint,
    });
  };
}

/**
 * 用户存在性验证装饰器
 */
export function IsUserExists(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUserExistsConstraint,
    });
  };
}

/**
 * 关键词存在性验证装饰器
 */
export function IsKeywordExists(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsKeywordExistsConstraint,
    });
  };
}

/**
 * 搜索量合理性验证装饰器
 */
export function IsSearchVolumeReasonable(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSearchVolumeReasonableConstraint,
    });
  };
}

/**
 * CPC 合理性验证装饰器
 */
export function IsCPCReasonable(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCPCReasonableConstraint,
    });
  };
}

/**
 * 关键词文本格式验证装饰器
 */
export function IsKeywordTextValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsKeywordTextValidConstraint,
    });
  };
}

/**
 * 优先级组合验证装饰器
 */
export function IsPriorityLevelCombinationValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPriorityLevelCombinationValidConstraint,
    });
  };
}

/**
 * 日期范围验证装饰器
 */
export function IsDateRangeValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateRangeValidConstraint,
    });
  };
}

// ==================== 组合验证函数 ====================

/**
 * 验证枚举数组
 */
export function validateEnumArray<T>(
  values: T[],
  enumObject: Record<string, T>,
  fieldName: string,
): string[] {
  const errors: string[] = [];
  const validValues = Object.values(enumObject);

  for (const value of values) {
    if (!validValues.includes(value)) {
      errors.push(`${fieldName} 包含无效值: ${value}`);
    }
  }

  return errors;
}

/**
 * 验证数值范围
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string,
): string[] {
  const errors: string[] = [];

  if (!isNumber(value)) {
    errors.push(`${fieldName} 必须是数字`);
    return errors;
  }

  if (value < min) {
    errors.push(`${fieldName} 不能小于 ${min}`);
  }

  if (value > max) {
    errors.push(`${fieldName} 不能大于 ${max}`);
  }

  return errors;
}

/**
 * 验证关键词业务规则
 */
export function validateKeywordBusinessRules(data: {
  priorityLevel?: KeywordPriorityLevel;
  competitionLevel?: KeywordCompetitionLevel;
  searchVolume?: number;
  difficulty?: number;
  intentType?: KeywordIntentType;
  productLine?: ProductLine;
}): string[] {
  const errors: string[] = [];

  // P0 级关键词业务规则
  if (data.priorityLevel === KeywordPriorityLevel.P0) {
    if (data.searchVolume && data.searchVolume < 1000) {
      errors.push('P0 级关键词搜索量应该 ≥ 1000');
    }
    
    if (data.difficulty && data.difficulty > 80) {
      errors.push('P0 级关键词难度不应该过高 (≤ 80)');
    }
  }

  // P4 级关键词业务规则
  if (data.priorityLevel === KeywordPriorityLevel.P4) {
    if (data.competitionLevel === KeywordCompetitionLevel.HIGH) {
      errors.push('P4 级关键词不应该是高竞争度');
    }
  }

  // 交易型关键词建议
  if (data.intentType === KeywordIntentType.TRANSACTIONAL) {
    if (data.priorityLevel && [KeywordPriorityLevel.P3, KeywordPriorityLevel.P4].includes(data.priorityLevel)) {
      errors.push('交易型关键词建议设置为较高优先级 (P0-P2)');
    }
  }

  // 难度和竞争度的一致性检查
  if (data.difficulty && data.competitionLevel) {
    if (data.difficulty > 70 && data.competitionLevel === KeywordCompetitionLevel.LOW) {
      errors.push('高难度关键词的竞争等级不应该设置为低');
    }
    
    if (data.difficulty < 30 && data.competitionLevel === KeywordCompetitionLevel.HIGH) {
      errors.push('低难度关键词的竞争等级不应该设置为高');
    }
  }

  return errors;
}

/**
 * 验证批量操作数据
 */
export function validateBulkOperationData(data: {
  keywordIds: string[];
  maxBatchSize?: number;
}): string[] {
  const errors: string[] = [];
  const maxSize = data.maxBatchSize || 100;

  if (!Array.isArray(data.keywordIds)) {
    errors.push('关键词 ID 列表必须是数组');
    return errors;
  }

  if (data.keywordIds.length === 0) {
    errors.push('关键词 ID 列表不能为空');
  }

  if (data.keywordIds.length > maxSize) {
    errors.push(`批量操作最多支持 ${maxSize} 个关键词`);
  }

  // 检查 ID 格式
  const invalidIds = data.keywordIds.filter(id => !isUUID(id, 4));
  if (invalidIds.length > 0) {
    errors.push(`包含无效的关键词 ID: ${invalidIds.slice(0, 5).join(', ')}${invalidIds.length > 5 ? '...' : ''}`);
  }

  // 检查重复 ID
  const uniqueIds = new Set(data.keywordIds);
  if (uniqueIds.size !== data.keywordIds.length) {
    errors.push('关键词 ID 列表包含重复项');
  }

  return errors;
}

// ==================== 导出所有验证器 ====================

export const KeywordValidators = {
  IsKeywordTextUniqueConstraint,
  IsUserExistsConstraint,
  IsKeywordExistsConstraint,
  IsSearchVolumeReasonableConstraint,
  IsCPCReasonableConstraint,
  IsKeywordTextValidConstraint,
  IsPriorityLevelCombinationValidConstraint,
  IsDateRangeValidConstraint,
};