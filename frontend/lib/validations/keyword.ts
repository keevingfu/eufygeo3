import { z } from 'zod';
import { KeywordPriority, KeywordStatus, ChannelType, AIOStatus } from '@/types/keyword';

// 关键词创建验证 schema
export const createKeywordSchema = z.object({
  term: z
    .string()
    .min(1, '关键词不能为空')
    .max(100, '关键词长度不能超过 100 字符')
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9\s\-_]+$/, '关键词只能包含中文、英文、数字、空格、连字符和下划线'),
  
  priority: z.nativeEnum(KeywordPriority, {
    required_error: '请选择优先级',
  }),
  
  channelType: z.nativeEnum(ChannelType, {
    required_error: '请选择渠道类型',
  }),
  
  tier: z
    .number()
    .int('层级必须是整数')
    .min(1, '层级最小值为 1')
    .max(5, '层级最大值为 5'),
  
  parentId: z
    .string()
    .optional()
    .nullable(),
  
  searchVolume: z
    .number()
    .int('搜索量必须是整数')
    .min(0, '搜索量不能为负数')
    .max(10000000, '搜索量不能超过 1000 万')
    .optional(),
  
  competition: z
    .number()
    .min(0, '竞争度不能小于 0')
    .max(1, '竞争度不能大于 1')
    .optional(),
  
  cpc: z
    .number()
    .min(0, 'CPC 不能为负数')
    .max(1000, 'CPC 不能超过 1000')
    .optional(),
  
  description: z
    .string()
    .max(500, '描述长度不能超过 500 字符')
    .optional(),
  
  tags: z
    .array(z.string().max(50, '标签长度不能超过 50 字符'))
    .max(10, '标签数量不能超过 10 个')
    .optional(),
});

// 关键词更新验证 schema
export const updateKeywordSchema = createKeywordSchema.partial().extend({
  id: z.string().min(1, 'ID 不能为空'),
  status: z.nativeEnum(KeywordStatus).optional(),
});

// AIO 配置验证 schema
export const aioConfigSchema = z.object({
  enabled: z.boolean(),
  
  targetPosition: z
    .number()
    .int('目标排名必须是整数')
    .min(1, '目标排名最小值为 1')
    .max(10, '目标排名最大值为 10'),
  
  maxBid: z
    .number()
    .min(0.01, '最大出价不能小于 0.01')
    .max(100, '最大出价不能超过 100'),
  
  budget: z
    .number()
    .min(1, '预算不能小于 1')
    .max(10000, '预算不能超过 10000'),
  
  bidStrategy: z
    .enum(['MANUAL', 'AUTO_CPC', 'AUTO_CPA', 'AUTO_ROAS'])
    .default('MANUAL')
    .optional(),
  
  schedule: z
    .object({
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '时间格式不正确'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, '时间格式不正确'),
      daysOfWeek: z
        .array(z.number().int().min(0).max(6))
        .min(1, '至少选择一天')
        .max(7, '最多选择 7 天'),
      timezone: z.string().default('Asia/Shanghai'),
    })
    .optional(),
  
  rules: z
    .array(
      z.object({
        condition: z.string().min(1, '条件不能为空'),
        action: z.string().min(1, '动作不能为空'),
        value: z.number(),
        enabled: z.boolean().default(true),
      })
    )
    .max(10, '规则数量不能超过 10 个')
    .optional(),
});

// 批量导入验证 schema
export const bulkImportSchema = z.object({
  keywords: z
    .array(createKeywordSchema.omit({ parentId: true }))
    .min(1, '至少导入一个关键词')
    .max(1000, '单次导入不能超过 1000 个关键词'),
  
  defaultPriority: z.nativeEnum(KeywordPriority).optional(),
  defaultChannelType: z.nativeEnum(ChannelType).optional(),
  defaultTier: z.number().int().min(1).max(5).optional(),
  
  overwriteExisting: z.boolean().default(false),
  skipInvalid: z.boolean().default(true),
});

// 筛选验证 schema
export const filterSchema = z.object({
  term: z.string().optional(),
  priority: z.array(z.nativeEnum(KeywordPriority)).optional(),
  status: z.array(z.nativeEnum(KeywordStatus)).optional(),
  channelType: z.array(z.nativeEnum(ChannelType)).optional(),
  aioStatus: z.array(z.nativeEnum(AIOStatus)).optional(),
  tier: z.array(z.number().int().min(1).max(5)).optional(),
  
  searchVolumeMin: z.number().min(0).optional(),
  searchVolumeMax: z.number().min(0).optional(),
  competitionMin: z.number().min(0).max(1).optional(),
  competitionMax: z.number().min(0).max(1).optional(),
  cpcMin: z.number().min(0).optional(),
  cpcMax: z.number().min(0).optional(),
  
  parentId: z.string().optional(),
  hasChildren: z.boolean().optional(),
  
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
}).refine(
  (data) => {
    // 验证搜索量范围
    if (data.searchVolumeMin !== undefined && data.searchVolumeMax !== undefined) {
      return data.searchVolumeMin <= data.searchVolumeMax;
    }
    return true;
  },
  {
    message: '搜索量最小值不能大于最大值',
    path: ['searchVolumeMax'],
  }
).refine(
  (data) => {
    // 验证竞争度范围
    if (data.competitionMin !== undefined && data.competitionMax !== undefined) {
      return data.competitionMin <= data.competitionMax;
    }
    return true;
  },
  {
    message: '竞争度最小值不能大于最大值',
    path: ['competitionMax'],
  }
).refine(
  (data) => {
    // 验证 CPC 范围
    if (data.cpcMin !== undefined && data.cpcMax !== undefined) {
      return data.cpcMin <= data.cpcMax;
    }
    return true;
  },
  {
    message: 'CPC 最小值不能大于最大值',
    path: ['cpcMax'],
  }
).refine(
  (data) => {
    // 验证创建时间范围
    if (data.createdAfter && data.createdBefore) {
      return new Date(data.createdAfter) <= new Date(data.createdBefore);
    }
    return true;
  },
  {
    message: '开始时间不能晚于结束时间',
    path: ['createdBefore'],
  }
);

// 导出表单输入类型
export type CreateKeywordInput = z.infer<typeof createKeywordSchema>;
export type UpdateKeywordInput = z.infer<typeof updateKeywordSchema>;
export type AIOConfigInput = z.infer<typeof aioConfigSchema>;
export type BulkImportInput = z.infer<typeof bulkImportSchema>;
export type FilterInput = z.infer<typeof filterSchema>;

// 验证错误处理工具
export function getValidationErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
}

// 表单数据清理工具
export function cleanFormData<T>(data: T): T {
  const cleaned = { ...data };
  
  // 移除空字符串和 undefined 值
  Object.keys(cleaned).forEach((key) => {
    const value = (cleaned as any)[key];
    if (value === '' || value === undefined) {
      delete (cleaned as any)[key];
    }
  });
  
  return cleaned;
}

// 关键词重复性检查
export function validateKeywordUniqueness(
  newKeywords: string[],
  existingKeywords: string[]
): { valid: boolean; duplicates: string[] } {
  const duplicates = newKeywords.filter((keyword) =>
    existingKeywords.includes(keyword.toLowerCase().trim())
  );
  
  return {
    valid: duplicates.length === 0,
    duplicates,
  };
}

// 关键词层级验证
export function validateKeywordHierarchy(
  keyword: { tier: number; parentId?: string },
  parentKeyword?: { tier: number }
): { valid: boolean; message?: string } {
  if (!keyword.parentId) {
    // 根关键词，层级必须是 1
    if (keyword.tier !== 1) {
      return {
        valid: false,
        message: '根关键词的层级必须是 1',
      };
    }
  } else {
    // 子关键词，层级必须比父关键词大 1
    if (!parentKeyword) {
      return {
        valid: false,
        message: '未找到父关键词',
      };
    }
    
    if (keyword.tier !== parentKeyword.tier + 1) {
      return {
        valid: false,
        message: `子关键词的层级必须是 ${parentKeyword.tier + 1}`,
      };
    }
  }
  
  return { valid: true };
}