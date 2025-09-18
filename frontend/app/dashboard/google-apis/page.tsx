'use client';

import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Input,
  Button,
  Table,
  Space,
  Tag,
  Spin,
  Alert,
  Row,
  Col,
  Statistic,
  List,
  Typography,
  message
} from 'antd';
import {
  SearchOutlined,
  LineChartOutlined,
  GlobalOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const { TabPane } = Tabs;
const { Search } = Input;
const { Title, Text, Paragraph } = Typography;

interface SearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  domain: string;
}

interface TrendData {
  date: string;
  value: number;
}

export default function GoogleApisPage() {
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [competitorData, setCompetitorData] = useState<any>(null);

  // 搜索关键词
  const handleSearchKeyword = async (keyword: string) => {
    if (!keyword) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4006/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query SearchKeyword($keyword: String!) {
              searchKeyword(keyword: $keyword) {
                keyword
                total_results
                organic_results {
                  position
                  title
                  link
                  snippet
                  domain
                }
                people_also_ask
                related_searches
              }
            }
          `,
          variables: { keyword }
        })
      });

      const data = await response.json();
      if (data.data?.searchKeyword) {
        setSearchResults(data.data.searchKeyword);
        message.success('搜索完成');
      }
    } catch (error) {
      message.error('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取关键词趋势
  const handleGetTrends = async (keyword: string) => {
    if (!keyword) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4006/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetKeywordTrends($keyword: String!) {
              getKeywordTrends(keyword: $keyword) {
                keyword
                trend_data {
                  date
                  value
                }
              }
            }
          `,
          variables: { keyword }
        })
      });

      const data = await response.json();
      if (data.data?.getKeywordTrends) {
        setTrendData(data.data.getKeywordTrends.trend_data);
        message.success('趋势数据获取成功');
      }
    } catch (error) {
      message.error('获取趋势失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 分析竞争对手
  const handleAnalyzeCompetitor = async (domain: string) => {
    if (!domain) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4006/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query AnalyzeCompetitor($domain: String!) {
              analyzeCompetitor(domain: $domain) {
                domain
                indexed_pages
                total_backlinks
                top_pages
              }
            }
          `,
          variables: { domain }
        })
      });

      const data = await response.json();
      if (data.data?.analyzeCompetitor) {
        setCompetitorData(data.data.analyzeCompetitor);
        message.success('竞争对手分析完成');
      }
    } catch (error) {
      message.error('分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 搜索结果表格列定义
  const searchColumns = [
    {
      title: '排名',
      dataIndex: 'position',
      key: 'position',
      width: 80,
      render: (position: number) => (
        <Tag color={position <= 3 ? 'gold' : position <= 10 ? 'blue' : 'default'}>
          #{position}
        </Tag>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: SearchResult) => (
        <a href={record.link} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
      )
    },
    {
      title: '域名',
      dataIndex: 'domain',
      key: 'domain',
      width: 200
    },
    {
      title: '摘要',
      dataIndex: 'snippet',
      key: 'snippet',
      ellipsis: true
    }
  ];

  // 趋势图表配置
  const getTrendChartOption = () => {
    return {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: trendData.map(d => d.date)
      },
      yAxis: {
        type: 'value',
        name: '搜索热度'
      },
      series: [
        {
          name: '搜索趋势',
          type: 'line',
          data: trendData.map(d => d.value),
          smooth: true,
          areaStyle: {
            opacity: 0.3
          }
        }
      ]
    };
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Google APIs 集成</Title>
        <Paragraph type="secondary">
          使用 Google Search API 和 SerpApi 获取关键词数据、搜索趋势和竞争对手分析
        </Paragraph>
      </div>

      <Tabs defaultActiveKey="search">
        <TabPane tab={<span><SearchOutlined /> 关键词搜索</span>} key="search">
          <Card>
            <Search
              placeholder="输入关键词进行搜索"
              allowClear
              enterButton="搜索"
              size="large"
              loading={loading}
              onSearch={handleSearchKeyword}
              style={{ marginBottom: 24 }}
            />

            {searchResults && (
              <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="搜索结果总数"
                        value={searchResults.total_results || 'N/A'}
                        prefix={<GlobalOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="相关问题"
                        value={searchResults.people_also_ask?.length || 0}
                        prefix={<QuestionCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="相关搜索"
                        value={searchResults.related_searches?.length || 0}
                        prefix={<SearchOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="搜索结果" style={{ marginBottom: 16 }}>
                  <Table
                    dataSource={searchResults.organic_results}
                    columns={searchColumns}
                    rowKey="position"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>

                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="用户常问问题">
                      <List
                        size="small"
                        dataSource={searchResults.people_also_ask}
                        renderItem={(item: string) => (
                          <List.Item>
                            <QuestionCircleOutlined style={{ marginRight: 8 }} />
                            {item}
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="相关搜索">
                      <Space wrap>
                        {searchResults.related_searches?.map((search: string) => (
                          <Tag
                            key={search}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSearchKeyword(search)}
                          >
                            {search}
                          </Tag>
                        ))}
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </Card>
        </TabPane>

        <TabPane tab={<span><LineChartOutlined /> 趋势分析</span>} key="trends">
          <Card>
            <Search
              placeholder="输入关键词查看趋势"
              allowClear
              enterButton="获取趋势"
              size="large"
              loading={loading}
              onSearch={handleGetTrends}
              style={{ marginBottom: 24 }}
            />

            {trendData.length > 0 && (
              <div>
                <Alert
                  message="关键词趋势"
                  description="显示过去12个月的搜索趋势数据"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <ReactECharts
                  option={getTrendChartOption()}
                  style={{ height: 400 }}
                />
              </div>
            )}
          </Card>
        </TabPane>

        <TabPane tab={<span><TrophyOutlined /> 竞争对手分析</span>} key="competitor">
          <Card>
            <Search
              placeholder="输入竞争对手域名（如: example.com）"
              allowClear
              enterButton="分析"
              size="large"
              loading={loading}
              onSearch={handleAnalyzeCompetitor}
              style={{ marginBottom: 24 }}
            />

            {competitorData && (
              <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="索引页面数"
                        value={competitorData.indexed_pages}
                        suffix="页"
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="反向链接总数"
                        value={competitorData.total_backlinks}
                        suffix="个"
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="热门页面">
                  <List
                    dataSource={competitorData.top_pages}
                    renderItem={(page: string, index: number) => (
                      <List.Item>
                        <Space>
                          <Tag color="blue">#{index + 1}</Tag>
                          <Text>{page}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>

      {loading && (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" tip="正在获取数据..." />
        </div>
      )}
    </div>
  );
}