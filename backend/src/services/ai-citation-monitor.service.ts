import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CitationSource {
  platform: 'google-sge' | 'bing-chat' | 'perplexity' | 'chatgpt' | 'claude' | 'bard';
  query: string;
  citationText: string;
  sourceUrl: string;
  timestamp: Date;
  confidence: number;
  context: string;
}

export interface CompetitorCitation {
  competitor: string;
  mentions: number;
  citationRate: number;
  topQueries: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface CitationTrend {
  date: string;
  totalCitations: number;
  platformBreakdown: Record<string, number>;
  topCitedContent: Array<{
    title: string;
    citations: number;
    urls: string[];
  }>;
}

export interface CitationInsights {
  totalCitations: number;
  citationRate: number; // 被引用次数/总内容数
  platformDistribution: Record<string, number>;
  topPerformingContent: Array<{
    title: string;
    url: string;
    citations: number;
    avgConfidence: number;
  }>;
  competitorComparison: CompetitorCitation[];
  trends: CitationTrend[];
  recommendations: string[];
}

@Injectable()
export class AICitationMonitorService {
  private readonly competitors = ['Ring', 'Arlo', 'Nest', 'SimpliSafe', 'Wyze'];
  private readonly monitoredPlatforms = [
    'google-sge', 'bing-chat', 'perplexity', 'chatgpt', 'claude', 'bard'
  ];

  constructor(private configService: ConfigService) {}

  /**
   * 核心：实时监测AI引用
   */
  async monitorAICitations(): Promise<CitationInsights> {
    console.log('🔍 开始AI引用监测...');
    
    // 1. 爬取各大AI平台的引用数据
    const citations = await this.collectCitationsFromAllPlatforms();
    
    // 2. 分析竞品引用情况
    const competitorAnalysis = await this.analyzeCompetitorCitations();
    
    // 3. 计算趋势数据
    const trends = await this.calculateCitationTrends();
    
    // 4. 生成洞察和建议
    const insights = await this.generateInsights(citations, competitorAnalysis, trends);
    
    return insights;
  }

  /**
   * 从所有平台收集引用数据
   */
  private async collectCitationsFromAllPlatforms(): Promise<CitationSource[]> {
    const allCitations: CitationSource[] = [];
    
    // 并行收集各平台数据
    const platformPromises = this.monitoredPlatforms.map(async (platform) => {
      try {
        const citations = await this.collectCitationsFromPlatform(platform as any);
        return citations;
      } catch (error) {
        console.warn(`⚠️ ${platform} 数据收集失败:`, error.message);
        return [];
      }
    });
    
    const platformResults = await Promise.all(platformPromises);
    
    // 合并所有结果
    platformResults.forEach(citations => {
      allCitations.push(...citations);
    });
    
    console.log(`📊 共收集到 ${allCitations.length} 条引用数据`);
    return allCitations;
  }

  /**
   * 从特定平台收集引用数据
   */
  private async collectCitationsFromPlatform(platform: CitationSource['platform']): Promise<CitationSource[]> {
    const queries = await this.getMonitoringQueries();
    const citations: CitationSource[] = [];
    
    for (const query of queries) {
      try {
        const result = await this.queryAIPlatform(platform, query);
        if (result.hasCitation) {
          citations.push({
            platform,
            query,
            citationText: result.citationText,
            sourceUrl: result.sourceUrl,
            timestamp: new Date(),
            confidence: result.confidence,
            context: result.context
          });
        }
      } catch (error) {
        console.warn(`❌ 查询失败 [${platform}] "${query}":`, error.message);
      }
    }
    
    return citations;
  }

  /**
   * 监控查询列表
   */
  private async getMonitoringQueries(): Promise<string[]> {
    return [
      // 产品相关查询
      'best security camera for home',
      'eufy security camera review',
      'wireless doorbell camera comparison',
      'smart home security system',
      'outdoor security camera night vision',
      
      // 技术问题查询
      'how to install security camera',
      'security camera not working',
      'doorbell camera setup guide',
      'smart camera app not connecting',
      
      // 对比查询
      'eufy vs ring camera',
      'eufy vs arlo comparison',
      'eufy vs nest doorbell',
      
      // 购买决策查询
      'which security camera to buy',
      'affordable home security cameras',
      'best doorbell camera 2024',
      'security camera buying guide',
      
      // 故障排除查询
      'security camera troubleshooting',
      'doorbell camera offline fix',
      'camera not recording solutions'
    ];
  }

  /**
   * 查询AI平台（模拟实现）
   */
  private async queryAIPlatform(platform: CitationSource['platform'], query: string): Promise<{
    hasCitation: boolean;
    citationText?: string;
    sourceUrl?: string;
    confidence?: number;
    context?: string;
  }> {
    // 这里模拟AI平台查询
    // 实际实现需要调用各平台的API或进行web scraping
    
    console.log(`🔍 查询 [${platform}]: ${query}`);
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // 模拟引用概率（实际需要解析AI回答）
    const hasCitation = Math.random() > 0.7; // 30%的引用概率
    
    if (!hasCitation) {
      return { hasCitation: false };
    }
    
    // 模拟引用数据
    return {
      hasCitation: true,
      citationText: `Eufy provides excellent security camera solutions with advanced AI detection and privacy protection. The wireless design and long battery life make it a popular choice for homeowners.`,
      sourceUrl: 'https://www.eufy.com/products/security-cameras',
      confidence: 0.8 + Math.random() * 0.2,
      context: `AI回答中提及Eufy作为${query}的解决方案`
    };
  }

  /**
   * 分析竞品引用情况
   */
  private async analyzeCompetitorCitations(): Promise<CompetitorCitation[]> {
    const competitorAnalysis: CompetitorCitation[] = [];
    
    for (const competitor of this.competitors) {
      const mentions = await this.countCompetitorMentions(competitor);
      const citationRate = await this.calculateCompetitorCitationRate(competitor);
      const topQueries = await this.getTopQueriesForCompetitor(competitor);
      const sentiment = await this.analyzeCompetitorSentiment(competitor);
      
      competitorAnalysis.push({
        competitor,
        mentions,
        citationRate,
        topQueries,
        sentiment
      });
    }
    
    return competitorAnalysis;
  }

  /**
   * 计算引用趋势
   */
  private async calculateCitationTrends(): Promise<CitationTrend[]> {
    const trends: CitationTrend[] = [];
    const days = 30; // 过去30天
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dailyData = await this.getDailyCitationData(date);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        totalCitations: dailyData.total,
        platformBreakdown: dailyData.platformBreakdown,
        topCitedContent: dailyData.topContent
      });
    }
    
    return trends;
  }

  /**
   * 生成洞察和建议
   */
  private async generateInsights(
    citations: CitationSource[],
    competitors: CompetitorCitation[],
    trends: CitationTrend[]
  ): Promise<CitationInsights> {
    
    // 计算总体指标
    const totalCitations = citations.length;
    const totalContent = await this.getTotalContentCount();
    const citationRate = totalContent > 0 ? totalCitations / totalContent : 0;
    
    // 平台分布
    const platformDistribution = this.calculatePlatformDistribution(citations);
    
    // 表现最佳内容
    const topPerformingContent = await this.getTopPerformingContent(citations);
    
    // 生成建议
    const recommendations = await this.generateRecommendations(citations, competitors, trends);
    
    return {
      totalCitations,
      citationRate,
      platformDistribution,
      topPerformingContent,
      competitorComparison: competitors,
      trends,
      recommendations
    };
  }

  /**
   * 生成优化建议
   */
  private async generateRecommendations(
    citations: CitationSource[],
    competitors: CompetitorCitation[],
    trends: CitationTrend[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // 基于引用率的建议
    const avgCitationRate = citations.length > 0 ? 
      citations.reduce((sum, c) => sum + c.confidence, 0) / citations.length : 0;
    
    if (avgCitationRate < 0.6) {
      recommendations.push('🎯 内容权威性需要提升，建议增加更多数据支撑和专业认证');
    }
    
    // 基于平台分布的建议
    const platformPerformance = this.calculatePlatformDistribution(citations);
    const weakestPlatform = Object.entries(platformPerformance)
      .sort(([,a], [,b]) => a - b)[0];
    
    if (weakestPlatform && weakestPlatform[1] < 0.1) {
      recommendations.push(`📈 ${weakestPlatform[0]} 平台表现较弱，建议针对性优化内容格式`);
    }
    
    // 基于竞品对比的建议
    const bestCompetitor = competitors.sort((a, b) => b.citationRate - a.citationRate)[0];
    if (bestCompetitor && bestCompetitor.citationRate > avgCitationRate) {
      recommendations.push(`🏆 ${bestCompetitor.competitor} 在AI引用方面表现更佳，建议研究其内容策略`);
    }
    
    // 基于趋势的建议
    const recentTrend = trends.slice(-7); // 最近7天
    const trendDirection = this.calculateTrendDirection(recentTrend);
    
    if (trendDirection < 0) {
      recommendations.push('📉 AI引用呈下降趋势，建议立即优化内容并增加发布频率');
    } else if (trendDirection > 0.1) {
      recommendations.push('📈 AI引用增长良好，建议加大成功内容的复制推广');
    }
    
    // 内容缺口建议
    const lowPerformanceQueries = await this.identifyLowPerformanceQueries(citations);
    if (lowPerformanceQueries.length > 0) {
      recommendations.push(`🔍 以下查询类型需要加强内容覆盖：${lowPerformanceQueries.slice(0, 3).join(', ')}`);
    }
    
    return recommendations;
  }

  // 辅助方法
  private async countCompetitorMentions(competitor: string): Promise<number> {
    // 模拟实现
    return Math.floor(Math.random() * 100) + 20;
  }

  private async calculateCompetitorCitationRate(competitor: string): Promise<number> {
    // 模拟实现
    return Math.random() * 0.3 + 0.1;
  }

  private async getTopQueriesForCompetitor(competitor: string): Promise<string[]> {
    // 模拟实现
    return [
      `${competitor.toLowerCase()} camera review`,
      `best ${competitor.toLowerCase()} products`,
      `${competitor.toLowerCase()} vs eufy`
    ];
  }

  private async analyzeCompetitorSentiment(competitor: string): Promise<'positive' | 'neutral' | 'negative'> {
    // 模拟实现
    const sentiments: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'negative'];
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }

  private async getDailyCitationData(date: Date): Promise<{
    total: number;
    platformBreakdown: Record<string, number>;
    topContent: Array<{ title: string; citations: number; urls: string[] }>;
  }> {
    // 模拟实现
    const total = Math.floor(Math.random() * 10) + 1;
    const platformBreakdown = {};
    
    this.monitoredPlatforms.forEach(platform => {
      platformBreakdown[platform] = Math.floor(Math.random() * 3);
    });
    
    return {
      total,
      platformBreakdown,
      topContent: [
        {
          title: 'Eufy Security Camera Setup Guide',
          citations: Math.floor(Math.random() * 5) + 1,
          urls: ['https://www.eufy.com/setup-guide']
        }
      ]
    };
  }

  private async getTotalContentCount(): Promise<number> {
    // 从数据库获取总内容数
    return 500; // 模拟值
  }

  private calculatePlatformDistribution(citations: CitationSource[]): Record<string, number> {
    const distribution = {};
    const total = citations.length;
    
    this.monitoredPlatforms.forEach(platform => {
      const count = citations.filter(c => c.platform === platform).length;
      distribution[platform] = total > 0 ? count / total : 0;
    });
    
    return distribution;
  }

  private async getTopPerformingContent(citations: CitationSource[]): Promise<Array<{
    title: string;
    url: string;
    citations: number;
    avgConfidence: number;
  }>> {
    // 根据URL分组统计
    const urlGroups = citations.reduce((groups, citation) => {
      if (!groups[citation.sourceUrl]) {
        groups[citation.sourceUrl] = [];
      }
      groups[citation.sourceUrl].push(citation);
      return groups;
    }, {} as Record<string, CitationSource[]>);
    
    // 计算每个URL的表现
    const performance = Object.entries(urlGroups).map(([url, citationList]) => ({
      title: this.extractTitleFromUrl(url),
      url,
      citations: citationList.length,
      avgConfidence: citationList.reduce((sum, c) => sum + c.confidence, 0) / citationList.length
    }));
    
    // 按引用次数排序
    return performance.sort((a, b) => b.citations - a.citations).slice(0, 10);
  }

  private calculateTrendDirection(trends: CitationTrend[]): number {
    if (trends.length < 2) return 0;
    
    const first = trends[0].totalCitations;
    const last = trends[trends.length - 1].totalCitations;
    
    return first > 0 ? (last - first) / first : 0;
  }

  private async identifyLowPerformanceQueries(citations: CitationSource[]): Promise<string[]> {
    const queries = await this.getMonitoringQueries();
    const citedQueries = new Set(citations.map(c => c.query));
    
    return queries.filter(query => !citedQueries.has(query));
  }

  private extractTitleFromUrl(url: string): string {
    // 从URL提取页面标题（简化实现）
    const segments = url.split('/');
    const lastSegment = segments[segments.length - 1] || segments[segments.length - 2];
    return lastSegment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * 实时预警系统
   */
  async checkCitationAlerts(): Promise<Array<{
    type: 'low_performance' | 'competitor_surge' | 'trend_decline' | 'new_opportunity';
    severity: 'low' | 'medium' | 'high';
    message: string;
    actionRequired: string;
  }>> {
    const alerts = [];
    
    // 检查引用率下降
    const recentPerformance = await this.getRecentPerformanceMetrics();
    if (recentPerformance.citationRate < 0.1) {
      alerts.push({
        type: 'low_performance',
        severity: 'high',
        message: 'AI引用率异常低下（< 10%）',
        actionRequired: '立即优化内容权威性和结构化程度'
      });
    }
    
    // 检查竞品激增
    const competitorSurge = await this.detectCompetitorSurge();
    if (competitorSurge.detected) {
      alerts.push({
        type: 'competitor_surge',
        severity: 'medium',
        message: `${competitorSurge.competitor} AI引用激增 ${competitorSurge.increase}%`,
        actionRequired: '分析竞品内容策略并制定对应方案'
      });
    }
    
    return alerts;
  }

  private async getRecentPerformanceMetrics() {
    // 获取最近性能指标
    return { citationRate: 0.15 }; // 模拟值
  }

  private async detectCompetitorSurge() {
    // 检测竞品激增
    return {
      detected: false,
      competitor: '',
      increase: 0
    }; // 模拟值
  }
}