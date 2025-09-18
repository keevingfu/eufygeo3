'use client';

import { useState, useEffect } from 'react';
import { Drawer, Grid } from 'antd';

const { useBreakpoint } = Grid;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
  showSidebar?: boolean;
  onSidebarClose?: () => void;
}

export function ResponsiveLayout({
  children,
  sidebarContent,
  showSidebar = false,
  onSidebarClose,
}: ResponsiveLayoutProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端侧边栏 */}
      {isMobile && sidebarContent && (
        <Drawer
          title="筛选条件"
          placement="left"
          open={showSidebar}
          onClose={onSidebarClose}
          width={320}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* 桌面端布局 */}
      <div className="flex">
        {/* 桌面端侧边栏 */}
        {!isMobile && sidebarContent && showSidebar && (
          <div className="w-80 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto">
            {sidebarContent}
          </div>
        )}

        {/* 主内容区域 */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

interface MobileTableWrapperProps {
  children: React.ReactNode;
  showScrollHint?: boolean;
}

export function MobileTableWrapper({ children, showScrollHint = true }: MobileTableWrapperProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {showScrollHint && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600">
          💡 提示：表格可以左右滑动查看更多内容
        </div>
      )}
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  minItemWidth?: number;
  gap?: number;
}

export function ResponsiveGrid({ 
  children, 
  minItemWidth = 280, 
  gap = 16 
}: ResponsiveGridProps) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
}

// 移动端优化的统计卡片
interface MobileStatsCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: string;
}

export function MobileStatsCard({
  title,
  value,
  suffix,
  trend,
  trendValue,
  color = '#1890ff',
}: MobileStatsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-1">{title}</div>
          <div className="text-2xl font-bold" style={{ color }}>
            {value}
            {suffix && <span className="text-sm text-gray-500 ml-1">{suffix}</span>}
          </div>
        </div>
        
        {trend && trendValue && (
          <div className={`text-sm ${getTrendColor()} flex items-center`}>
            <span className="mr-1">{getTrendIcon()}</span>
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

// 移动端操作按钮组
interface MobileActionGroupProps {
  actions: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    type?: 'primary' | 'default' | 'danger';
    disabled?: boolean;
  }>;
}

export function MobileActionGroup({ actions }: MobileActionGroupProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-padding-bottom">
      <div className="grid grid-cols-2 gap-2">
        {actions.slice(0, 4).map((action) => (
          <button
            key={action.key}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm
              ${
                action.type === 'primary'
                  ? 'bg-blue-500 text-white'
                  : action.type === 'danger'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }
              ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              transition-all duration-150
            `}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 响应式容器
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
}

export function ResponsiveContainer({
  children,
  className = '',
  maxWidth = 'full',
  padding = true,
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={`
        mx-auto
        ${maxWidthClasses[maxWidth]}
        ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// 自适应文本大小
interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  className?: string;
}

export function ResponsiveText({
  children,
  size = 'base',
  weight = 'normal',
  color,
  className = '',
}: ResponsiveTextProps) {
  const sizeClasses = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  return (
    <span
      className={`
        ${sizeClasses[size]}
        ${weightClasses[weight]}
        ${className}
      `}
      style={color ? { color } : {}}
    >
      {children}
    </span>
  );
}

// 移动端优化的搜索框
interface MobileSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
}

export function MobileSearch({
  value,
  onChange,
  onSearch,
  placeholder = '搜索...',
  loading = false,
}: MobileSearchProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (!isMobile) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearch?.(value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}