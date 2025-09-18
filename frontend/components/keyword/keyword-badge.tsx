'use client';

import { Tag } from 'antd';
import { cn } from '@/lib/utils';
import {
  KeywordPriority,
  AIOStatus,
  KeywordStatus,
  ChannelType,
} from '@/types/keyword';
import {
  getPriorityColor,
  getAIOStatusColor,
  getPriorityName,
  getAIOStatusName,
  getChannelName,
  getChannelIcon,
} from '@/lib/utils';

interface PriorityBadgeProps {
  priority: KeywordPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const colors = {
    [KeywordPriority.P0]: { color: '#dc2626', background: '#fef2f2', border: '#fecaca' },
    [KeywordPriority.P1]: { color: '#ea580c', background: '#fff7ed', border: '#fed7aa' },
    [KeywordPriority.P2]: { color: '#ca8a04', background: '#fefce8', border: '#fde047' },
    [KeywordPriority.P3]: { color: '#16a34a', background: '#f0fdf4', border: '#bbf7d0' },
    [KeywordPriority.P4]: { color: '#6b7280', background: '#f9fafb', border: '#e5e7eb' },
  };

  const style = colors[priority];

  return (
    <Tag
      color={style.color}
      style={{
        color: style.color,
        backgroundColor: style.background,
        borderColor: style.border,
        border: `1px solid ${style.border}`,
      }}
      className={cn('inline-flex items-center font-medium', className)}
    >
      {priority}
    </Tag>
  );
}

interface AIOStatusBadgeProps {
  status: AIOStatus;
  className?: string;
}

export function AIOStatusBadge({ status, className }: AIOStatusBadgeProps) {
  const colors = {
    [AIOStatus.ACTIVE]: { color: '#16a34a', background: '#f0fdf4', border: '#bbf7d0' },
    [AIOStatus.PENDING]: { color: '#ea580c', background: '#fff7ed', border: '#fed7aa' },
    [AIOStatus.DISABLED]: { color: '#6b7280', background: '#f9fafb', border: '#e5e7eb' },
    [AIOStatus.ERROR]: { color: '#dc2626', background: '#fef2f2', border: '#fecaca' },
  };

  const icons = {
    [AIOStatus.ACTIVE]: '✓',
    [AIOStatus.PENDING]: '⏳',
    [AIOStatus.DISABLED]: '⏸',
    [AIOStatus.ERROR]: '⚠',
  };

  const style = colors[status];
  const icon = icons[status];

  return (
    <Tag
      style={{
        color: style.color,
        backgroundColor: style.background,
        borderColor: style.border,
        border: `1px solid ${style.border}`,
      }}
      className={cn('inline-flex items-center gap-1 font-medium', className)}
    >
      <span>{icon}</span>
      {getAIOStatusName(status)}
    </Tag>
  );
}

interface KeywordStatusBadgeProps {
  status: KeywordStatus;
  className?: string;
}

export function KeywordStatusBadge({ status, className }: KeywordStatusBadgeProps) {
  const colors = {
    [KeywordStatus.ACTIVE]: { color: '#16a34a', background: '#f0fdf4', border: '#bbf7d0' },
    [KeywordStatus.PAUSED]: { color: '#ea580c', background: '#fff7ed', border: '#fed7aa' },
    [KeywordStatus.ARCHIVED]: { color: '#6b7280', background: '#f9fafb', border: '#e5e7eb' },
  };

  const names = {
    [KeywordStatus.ACTIVE]: '激活',
    [KeywordStatus.PAUSED]: '暂停',
    [KeywordStatus.ARCHIVED]: '归档',
  };

  const style = colors[status];

  return (
    <Tag
      style={{
        color: style.color,
        backgroundColor: style.background,
        borderColor: style.border,
        border: `1px solid ${style.border}`,
      }}
      className={cn('inline-flex items-center font-medium', className)}
    >
      {names[status]}
    </Tag>
  );
}

interface ChannelBadgeProps {
  channelType: ChannelType;
  className?: string;
}

export function ChannelBadge({ channelType, className }: ChannelBadgeProps) {
  const colors = {
    [ChannelType.GOOGLE]: { color: '#1f2937', background: '#f3f4f6', border: '#d1d5db' },
    [ChannelType.AMAZON]: { color: '#ea580c', background: '#fff7ed', border: '#fed7aa' },
    [ChannelType.FACEBOOK]: { color: '#3b82f6', background: '#eff6ff', border: '#bfdbfe' },
    [ChannelType.INSTAGRAM]: { color: '#ec4899', background: '#fdf2f8', border: '#fbcfe8' },
    [ChannelType.YOUTUBE]: { color: '#dc2626', background: '#fef2f2', border: '#fecaca' },
    [ChannelType.TIKTOK]: { color: '#1f2937', background: '#f3f4f6', border: '#d1d5db' },
  };

  const style = colors[channelType];
  const icon = getChannelIcon(channelType);
  const name = getChannelName(channelType);

  return (
    <Tag
      style={{
        color: style.color,
        backgroundColor: style.background,
        borderColor: style.border,
        border: `1px solid ${style.border}`,
      }}
      className={cn('inline-flex items-center gap-1 font-medium', className)}
    >
      <span>{icon}</span>
      {name}
    </Tag>
  );
}

interface TierBadgeProps {
  tier: number;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const getColorByTier = (tier: number) => {
    if (tier === 1) return { color: '#dc2626', background: '#fef2f2', border: '#fecaca' };
    if (tier === 2) return { color: '#ea580c', background: '#fff7ed', border: '#fed7aa' };
    if (tier === 3) return { color: '#ca8a04', background: '#fefce8', border: '#fde047' };
    return { color: '#6b7280', background: '#f9fafb', border: '#e5e7eb' };
  };

  const style = getColorByTier(tier);

  return (
    <Tag
      style={{
        color: style.color,
        backgroundColor: style.background,
        borderColor: style.border,
        border: `1px solid ${style.border}`,
      }}
      className={cn('inline-flex items-center font-medium', className)}
    >
      T{tier}
    </Tag>
  );
}