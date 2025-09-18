'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  Space,
  Tag,
  Table,
  Progress,
  Button,
  Divider,
  Alert
} from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  StockOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface TrendData {
  date: string;
  value: number;
}

interface KeywordTrend {
  keyword: string;
  data: TrendData[];
  changePercent: number;
  trending: boolean;
}

interface CompetitorData {
  competitor: string;
  marketShare: number;
  keywordCount: number;
  avgPosition: number;
  visibility: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  previousValue: number;
  changePercent: number;
  trend: string;
  unit: string;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('LAST_30_DAYS');
  const [keywordTrends, setKeywordTrends] = useState<KeywordTrend[]>([]);
  const [competitorData, setCompetitorData] = useState<CompetitorData[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const router = useRouter();

  // 检查认证
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // 生成模拟数据（因为分析服务启动有问题，使用模拟数据展示）
  useEffect(() => {
    // 关键词趋势数据
    const generateTrendData = (baseValue: number, days: number) => {
      const data = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const trend = (days - i) / days * 0.3;
        const randomness = (Math.random() - 0.5) * 0.2;
        const value = Math.round(baseValue * (1 + trend + randomness));
        data.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          value
        });
      }
      return data;
    };

    const days = timeRange === 'LAST_7_DAYS' ? 7 : 
                 timeRange === 'LAST_90_DAYS' ? 90 : 30;

    const trends = [
      { keyword: 'eufy security camera', baseVolume: 45000 },
      { keyword: 'eufy robot vacuum', baseVolume: 38000 },
      { keyword: 'eufy doorbell', baseVolume: 32000 },
      { keyword: 'eufy smart home', baseVolume: 28000 }
    ].map(item => {
      const data = generateTrendData(item.baseVolume, days);
      const firstValue = data[0].value;
      const lastValue = data[data.length - 1].value;
      const changePercent = ((lastValue - firstValue) / firstValue) * 100;
      return {
        keyword: item.keyword,
        data,
        changePercent: Math.round(changePercent * 100) / 100,
        trending: changePercent > 10
      };
    });
    setKeywordTrends(trends);

    // 竞争对手数据
    setCompetitorData([
      { competitor: 'Arlo', marketShare: 25.5, keywordCount: 450, avgPosition: 3.2, visibility: 78.5 },
      { competitor: 'Ring', marketShare: 22.3, keywordCount: 380, avgPosition: 2.8, visibility: 82.1 },
      { competitor: 'Nest', marketShare: 18.7, keywordCount: 320, avgPosition: 3.5, visibility: 71.3 },
      { competitor: 'Eufy', marketShare: 15.2, keywordCount: 280, avgPosition: 4.1, visibility: 65.8 },
      { competitor: 'Others', marketShare: 18.3, keywordCount: 200, avgPosition: 5.2, visibility: 45.6 }
    ]);

    // 性能指标
    setMetrics([
      { name: '总搜索量', value: 35680000, previousValue: 32450000, changePercent: 9.95, trend: 'up', unit: '' },
      { name: '平均排名', value: 4.2, previousValue: 5.1, changePercent: -17.65, trend: 'up', unit: '' },
      { name: '点击率', value: 3.8, previousValue: 3.2, changePercent: 18.75, trend: 'up', unit: '%' },
      { name: '转化率', value: 2.4, previousValue: 2.1, changePercent: 14.29, trend: 'up', unit: '%' },
      { name: '内容产出', value: 156, previousValue: 98, changePercent: 59.18, trend: 'up', unit: '篇' },
      { name: '覆盖率', value: 68.5, previousValue: 61.2, changePercent: 11.93, trend: 'up', unit: '%' }
    ]);
  }, [timeRange]);

  // 关键词趋势图表配置
  const getTrendChartOption = () => {
    const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666'];
    return {
      color: colors,
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: keywordTrends.map(t => t.keyword),
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: keywordTrends[0]?.data.map(d => d.date) || []
      },
      yAxis: {
        type: 'value',
        name: '搜索量'
      },
      series: keywordTrends.map((trend, index) => ({
        name: trend.keyword,
        type: 'line',
        smooth: true,
        data: trend.data.map(d => d.value),
        itemStyle: {
          color: colors[index % colors.length]
        }
      }))
    };
  };

  // 竞争对手市场份额图表
  const getMarketShareChartOption = () => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}%'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '市场份额',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          data: competitorData.map(c => ({
            value: c.marketShare,
            name: c.competitor
          }))
        }
      ]
    };
  };

  // 竞争对手可见度对比
  const getVisibilityChartOption = () => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '可见度 %'
      },
      yAxis: {
        type: 'category',
        data: competitorData.map(c => c.competitor)
      },
      series: [
        {
          name: '可见度',
          type: 'bar',
          data: competitorData.map(c => c.visibility),
          itemStyle: {
            color: (params: any) => {
              const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'];
              return colors[params.dataIndex % colors.length];
            }
          }
        }
      ]
    };
  };

  const competitorColumns = [
    {
      title: '竞争对手',
      dataIndex: 'competitor',
      key: 'competitor',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '关键词数',
      dataIndex: 'keywordCount',
      key: 'keywordCount',
      sorter: (a: CompetitorData, b: CompetitorData) => a.keywordCount - b.keywordCount
    },
    {
      title: '平均排名',
      dataIndex: 'avgPosition',
      key: 'avgPosition',
      render: (value: number) => value.toFixed(1),
      sorter: (a: CompetitorData, b: CompetitorData) => a.avgPosition - b.avgPosition
    },
    {
      title: '可见度',
      dataIndex: 'visibility',
      key: 'visibility',
      render: (value: number) => (
        <Progress percent={value} size="small" />
      ),
      sorter: (a: CompetitorData, b: CompetitorData) => a.visibility - b.visibility
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/keywords')}>
            返回
          </Button>
          <Title level={3} style={{ margin: 0 }}>数据分析仪表板</Title>
        </Space>
        <Select
          value={timeRange}
          onChange={setTimeRange}
          style={{ width: 200 }}
        >
          <Option value="LAST_7_DAYS">最近 7 天</Option>
          <Option value="LAST_30_DAYS">最近 30 天</Option>
          <Option value="LAST_90_DAYS">最近 90 天</Option>
        </Select>
      </div>

      {/* 性能指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {metrics.map((metric, index) => (
          <Col span={4} key={index}>
            <Card>
              <Statistic
                title={metric.name}
                value={metric.value}
                precision={metric.unit === '%' ? 1 : 0}
                suffix={metric.unit}
                valueStyle={{
                  color: metric.trend === 'up' ? '#3f8600' : '#cf1322',
                  fontSize: 20
                }}
                prefix={
                  metric.trend === 'up' ? <RiseOutlined /> : <FallOutlined />
                }
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(2)}%
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 关键词趋势 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card 
            title={<Space><LineChartOutlined />关键词搜索趋势</Space>}
          >
            <ReactECharts 
              option={getTrendChartOption()} 
              style={{ height: 400 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title={<Space><StockOutlined />趋势概览</Space>}
            style={{ height: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {keywordTrends.map((trend, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>{trend.keyword}</Text>
                    <Space>
                      {trend.trending && <Tag color="success">热门</Tag>}
                      <Tag color={trend.changePercent > 0 ? 'green' : 'red'}>
                        {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                      </Tag>
                    </Space>
                  </div>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 竞争分析 */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title={<Space><PieChartOutlined />市场份额分布</Space>}>
            <ReactECharts 
              option={getMarketShareChartOption()} 
              style={{ height: 300 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title={<Space><BarChartOutlined />品牌可见度对比</Space>}>
            <ReactECharts 
              option={getVisibilityChartOption()} 
              style={{ height: 300 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title={<Space><GlobalOutlined />竞争对手详情</Space>}>
            <Table
              dataSource={competitorData}
              columns={competitorColumns}
              rowKey="competitor"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 提示信息 */}
      <Alert
        message="数据说明"
        description="当前展示的是模拟数据。实际使用时，数据将从分析服务实时获取并更新。"
        type="info"
        showIcon
        style={{ marginTop: 24 }}
      />
    </div>
  );
}