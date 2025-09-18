'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { Card, Select, Space, Typography, Spin } from 'antd';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { MetricsTrend, ChartDataPoint } from '@/types/keyword';

const { Option } = Select;
const { Text } = Typography;

interface PerformanceChartProps {
  data: MetricsTrend[];
  loading?: boolean;
  height?: number;
  title?: string;
}

export function PerformanceChart({
  data,
  loading = false,
  height = 300,
  title = '性能趋势',
}: PerformanceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const [selectedMetric, setSelectedMetric] = useState('clicks');

  // 处理图表数据
  const chartData = useMemo(() => {
    const selectedTrend = data.find(trend => trend.metric === selectedMetric);
    if (!selectedTrend) return { dates: [], values: [] };

    return {
      dates: selectedTrend.data.map(point => point.date),
      values: selectedTrend.data.map(point => point.value),
    };
  }, [data, selectedMetric]);

  // 获取变化趋势
  const getTrendInfo = (metric: string) => {
    const trend = data.find(t => t.metric === metric);
    if (!trend) return { change: 0, changePercent: 0 };
    return { change: trend.change, changePercent: trend.changePercent };
  };

  // 图表配置
  const option: EChartsOption = useMemo(() => {
    const { dates, values } = chartData;
    const trendInfo = getTrendInfo(selectedMetric);

    return {
      title: {
        text: title,
        left: 'left',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
        formatter: (params: any) => {
          const param = params[0];
          return `
            <div>
              <div>${param.axisValue}</div>
              <div style="margin-top: 4px;">
                <span style="display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:${param.color}"></span>
                ${getMetricDisplayName(selectedMetric)}: <strong>${formatMetricValue(param.value, selectedMetric)}</strong>
              </div>
            </div>
          `;
        },
      },
      legend: {
        show: false,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: {
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatMetricValue(value, selectedMetric),
        },
      },
      series: [
        {
          name: getMetricDisplayName(selectedMetric),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
          },
          areaStyle: {
            opacity: 0.1,
          },
          data: values,
          itemStyle: {
            color: getMetricColor(selectedMetric),
          },
          emphasis: {
            focus: 'series',
          },
        },
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [chartData, selectedMetric, title]);

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  // 更新图表
  useEffect(() => {
    if (chartInstance.current && !loading) {
      chartInstance.current.setOption(option);
    }
  }, [option, loading]);

  return (
    <Card
      title={
        <Space className="w-full justify-between">
          <Text strong>{title}</Text>
          <Select
            value={selectedMetric}
            onChange={setSelectedMetric}
            style={{ width: 120 }}
            size="small"
          >
            <Option value="clicks">点击量</Option>
            <Option value="impressions">展现量</Option>
            <Option value="ctr">点击率</Option>
            <Option value="position">排名</Option>
            <Option value="conversions">转化量</Option>
            <Option value="revenue">收入</Option>
          </Select>
        </Space>
      }
      extra={
        <TrendIndicator
          change={getTrendInfo(selectedMetric).change}
          changePercent={getTrendInfo(selectedMetric).changePercent}
        />
      }
    >
      <Spin spinning={loading}>
        <div
          ref={chartRef}
          style={{ height: `${height}px`, width: '100%' }}
        />
      </Spin>
    </Card>
  );
}

// 趋势指示器
function TrendIndicator({ change, changePercent }: { change: number; changePercent: number }) {
  const isPositive = change > 0;
  const isNeutral = Math.abs(changePercent) < 0.1;

  return (
    <Space>
      <Text
        type={isNeutral ? 'secondary' : isPositive ? 'success' : 'danger'}
        className="text-sm"
      >
        {isPositive ? '↑' : change < 0 ? '↓' : '→'}
        {Math.abs(changePercent).toFixed(1)}%
      </Text>
    </Space>
  );
}

// 获取指标显示名称
function getMetricDisplayName(metric: string): string {
  const names: Record<string, string> = {
    clicks: '点击量',
    impressions: '展现量',
    ctr: '点击率',
    position: '平均排名',
    conversions: '转化量',
    revenue: '收入',
  };
  return names[metric] || metric;
}

// 获取指标颜色
function getMetricColor(metric: string): string {
  const colors: Record<string, string> = {
    clicks: '#3b82f6',
    impressions: '#10b981',
    ctr: '#f59e0b',
    position: '#ef4444',
    conversions: '#8b5cf6',
    revenue: '#06b6d4',
  };
  return colors[metric] || '#6b7280';
}

// 格式化指标值
function formatMetricValue(value: number, metric: string): string {
  switch (metric) {
    case 'clicks':
    case 'impressions':
    case 'conversions':
      return new Intl.NumberFormat('zh-CN').format(Math.round(value));
    case 'ctr':
      return `${(value * 100).toFixed(2)}%`;
    case 'position':
      return value.toFixed(1);
    case 'revenue':
      return `¥${value.toFixed(2)}`;
    default:
      return value.toString();
  }
}