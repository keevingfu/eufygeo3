import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { KeywordPriority, AIOStatus, ChannelType } from '@/types/keyword';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化数字
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('zh-CN', options).format(value);
}

// 格式化货币
export function formatCurrency(value: number, currency = 'CNY'): string {
  return formatNumber(value, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
}

// 格式化百分比
export function formatPercentage(value: number, fractionDigits = 2): string {
  return formatNumber(value, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

// 格式化日期
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  }).format(dateObj);
}

// 格式化日期时间
export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 获取相对时间
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}分钟前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}小时前`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}天前`;
  } else {
    return formatDate(dateObj);
  }
}

// 获取优先级颜色
export function getPriorityColor(priority: KeywordPriority): string {
  const colors = {
    [KeywordPriority.P0]: 'text-red-600 bg-red-50 border-red-200',
    [KeywordPriority.P1]: 'text-orange-600 bg-orange-50 border-orange-200',
    [KeywordPriority.P2]: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    [KeywordPriority.P3]: 'text-green-600 bg-green-50 border-green-200',
    [KeywordPriority.P4]: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return colors[priority] || colors[KeywordPriority.P4];
}

// 获取 AIO 状态颜色
export function getAIOStatusColor(status: AIOStatus): string {
  const colors = {
    [AIOStatus.ACTIVE]: 'text-green-600 bg-green-50 border-green-200',
    [AIOStatus.PENDING]: 'text-orange-600 bg-orange-50 border-orange-200',
    [AIOStatus.DISABLED]: 'text-gray-600 bg-gray-50 border-gray-200',
    [AIOStatus.ERROR]: 'text-red-600 bg-red-50 border-red-200',
  };
  return colors[status] || colors[AIOStatus.DISABLED];
}

// 获取渠道类型图标
export function getChannelIcon(channelType: ChannelType): string {
  const icons = {
    [ChannelType.GOOGLE]: '🔍',
    [ChannelType.AMAZON]: '📦',
    [ChannelType.FACEBOOK]: '👥',
    [ChannelType.INSTAGRAM]: '📸',
    [ChannelType.YOUTUBE]: '🎥',
    [ChannelType.TIKTOK]: '🎵',
  };
  return icons[channelType] || '🔍';
}

// 获取渠道类型名称
export function getChannelName(channelType: ChannelType): string {
  const names = {
    [ChannelType.GOOGLE]: 'Google',
    [ChannelType.AMAZON]: 'Amazon',
    [ChannelType.FACEBOOK]: 'Facebook',
    [ChannelType.INSTAGRAM]: 'Instagram',
    [ChannelType.YOUTUBE]: 'YouTube',
    [ChannelType.TIKTOK]: 'TikTok',
  };
  return names[channelType] || channelType;
}

// 获取优先级名称
export function getPriorityName(priority: KeywordPriority): string {
  const names = {
    [KeywordPriority.P0]: '最高优先级',
    [KeywordPriority.P1]: '高优先级',
    [KeywordPriority.P2]: '中优先级',
    [KeywordPriority.P3]: '低优先级',
    [KeywordPriority.P4]: '最低优先级',
  };
  return names[priority] || priority;
}

// 获取 AIO 状态名称
export function getAIOStatusName(status: AIOStatus): string {
  const names = {
    [AIOStatus.ACTIVE]: '激活',
    [AIOStatus.PENDING]: '待处理',
    [AIOStatus.DISABLED]: '禁用',
    [AIOStatus.ERROR]: '错误',
  };
  return names[status] || status;
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), delay);
    }
  };
}

// 生成唯一 ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// 深拷贝
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

// 数组去重
export function uniqueArray<T>(arr: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(arr)];
  }
  const seen = new Set();
  return arr.filter(item => {
    const keyValue = item[key];
    if (seen.has(keyValue)) {
      return false;
    }
    seen.add(keyValue);
    return true;
  });
}

// 数组分组
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// 计算变化百分比
export function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// 获取变化趋势
export function getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const change = calculateChangePercent(current, previous);
  if (Math.abs(change) < 0.1) return 'stable';
  return change > 0 ? 'up' : 'down';
}

// 验证邮箱
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证 URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 文件大小格式化
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

// 颜色转换（十六进制到 RGB）
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// 获取对比色
export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // 降级到传统方法
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

// 下载文件
export function downloadFile(content: string, filename: string, contentType = 'text/plain'): void {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}