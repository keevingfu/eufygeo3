import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { 
  Resolver, 
  Query, 
  Args, 
  ObjectType, 
  Field, 
  InputType, 
  Int,
  Float,
  registerEnumType 
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { IsOptional, IsEnum } from 'class-validator';

// Enums
enum TimeRange {
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  LAST_6_MONTHS = 'LAST_6_MONTHS',
  LAST_YEAR = 'LAST_YEAR'
}

enum MetricType {
  SEARCH_VOLUME = 'SEARCH_VOLUME',
  CPC = 'CPC',
  COMPETITION = 'COMPETITION',
  CONTENT_PERFORMANCE = 'CONTENT_PERFORMANCE',
  SEO_SCORE = 'SEO_SCORE'
}

registerEnumType(TimeRange, { name: 'TimeRange' });
registerEnumType(MetricType, { name: 'MetricType' });

// Types
@ObjectType()
class TrendDataPoint {
  @Field()
  date: string = '';

  @Field(() => Float)
  value: number = 0;

  @Field({ nullable: true })
  label?: string;
}

@ObjectType()
class KeywordTrend {
  @Field()
  keyword: string = '';

  @Field(() => [TrendDataPoint])
  data: TrendDataPoint[] = [];

  @Field(() => Float)
  changePercent: number = 0;

  @Field()
  trending: boolean = false;
}

@ObjectType()
class CompetitorData {
  @Field()
  competitor: string = '';

  @Field(() => Float)
  marketShare: number = 0;

  @Field(() => Int)
  keywordCount: number = 0;

  @Field(() => Float)
  avgPosition: number = 0;

  @Field(() => Float)
  visibility: number = 0;
}

@ObjectType()
class PerformanceMetric {
  @Field()
  name: string = '';

  @Field(() => Float)
  value: number = 0;

  @Field(() => Float)
  previousValue: number = 0;

  @Field(() => Float)
  changePercent: number = 0;

  @Field()
  trend: string = '';  // 'up', 'down', 'stable'

  @Field()
  unit: string = '';
}

@ObjectType()
class DashboardStats {
  @Field(() => Int)
  totalKeywords: number = 0;

  @Field(() => Int)
  totalContent: number = 0;

  @Field(() => Float)
  avgSearchVolume: number = 0;

  @Field(() => Float)
  avgCPC: number = 0;

  @Field(() => Float)
  avgSEOScore: number = 0;

  @Field(() => Int)
  topPerformingContent: number = 0;

  @Field(() => [PerformanceMetric])
  metrics: PerformanceMetric[] = [];
}

@ObjectType()
class KeywordDistribution {
  @Field()
  priority: string = '';

  @Field(() => Int)
  count: number = 0;

  @Field(() => Float)
  percentage: number = 0;
}

@ObjectType()
class ContentPerformance {
  @Field()
  contentId: string = '';

  @Field()
  title: string = '';

  @Field(() => Float)
  engagementRate: number = 0;

  @Field(() => Int)
  views: number = 0;

  @Field(() => Int)
  shares: number = 0;

  @Field(() => Float)
  conversionRate: number = 0;
}

@ObjectType()
class SERPFeature {
  @Field()
  feature: string = '';

  @Field(() => Float)
  frequency: number = 0;

  @Field(() => [String])
  keywords: string[] = [];
}

@ObjectType()
class MarketInsight {
  @Field()
  insight: string = '';

  @Field()
  category: string = '';

  @Field()
  importance: string = '';

  @Field()
  recommendation: string = '';
}

// Input types
@InputType()
class AnalyticsFilterInput {
  @Field(() => TimeRange, { nullable: true })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.LAST_30_DAYS;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  keywords?: string[] = [];

  @Field(() => String, { nullable: true })
  @IsOptional()
  priority?: string;

  @Field(() => MetricType, { nullable: true })
  @IsOptional()
  metricType?: MetricType = MetricType.SEARCH_VOLUME;
}

// Service
@Injectable()
class AnalyticsService {
  private readonly competitorData = [
    { competitor: 'Arlo', marketShare: 25.5, keywordCount: 450, avgPosition: 3.2, visibility: 78.5 },
    { competitor: 'Ring', marketShare: 22.3, keywordCount: 380, avgPosition: 2.8, visibility: 82.1 },
    { competitor: 'Nest', marketShare: 18.7, keywordCount: 320, avgPosition: 3.5, visibility: 71.3 },
    { competitor: 'Eufy', marketShare: 15.2, keywordCount: 280, avgPosition: 4.1, visibility: 65.8 },
    { competitor: 'Others', marketShare: 18.3, keywordCount: 200, avgPosition: 5.2, visibility: 45.6 }
  ];

  private generateTrendData(days: number, baseValue: number, volatility: number = 0.1): TrendDataPoint[] {
    const data: TrendDataPoint[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // 生成带有趋势和波动的数据
      const trend = (days - i) / days * 0.3; // 30% 上升趋势
      const randomness = (Math.random() - 0.5) * 2 * volatility;
      const value = Math.round(baseValue * (1 + trend + randomness));
      
      data.push({
        date: date.toISOString().split('T')[0],
        value,
        label: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      });
    }
    
    return data;
  }

  private getDaysFromTimeRange(timeRange: TimeRange): number {
    const mapping = {
      [TimeRange.LAST_7_DAYS]: 7,
      [TimeRange.LAST_30_DAYS]: 30,
      [TimeRange.LAST_90_DAYS]: 90,
      [TimeRange.LAST_6_MONTHS]: 180,
      [TimeRange.LAST_YEAR]: 365
    };
    return mapping[timeRange] || 30;
  }

  async getKeywordTrends(filter: AnalyticsFilterInput): Promise<KeywordTrend[]> {
    const days = this.getDaysFromTimeRange(filter.timeRange || TimeRange.LAST_30_DAYS);
    const sampleKeywords = filter.keywords?.length 
      ? filter.keywords 
      : ['eufy security camera', 'eufy robot vacuum', 'eufy doorbell', 'eufy smart home'];

    return sampleKeywords.map((keyword, index) => {
      const baseVolume = 10000 + Math.random() * 40000;
      const data = this.generateTrendData(days, baseVolume, 0.15);
      
      const firstValue = data[0].value;
      const lastValue = data[data.length - 1].value;
      const changePercent = ((lastValue - firstValue) / firstValue) * 100;
      
      return {
        keyword,
        data,
        changePercent: Math.round(changePercent * 100) / 100,
        trending: changePercent > 10
      };
    });
  }

  async getCompetitorAnalysis(): Promise<CompetitorData[]> {
    return this.competitorData.map(data => ({
      ...data,
      visibility: Math.round(data.visibility * 10) / 10
    }));
  }

  async getDashboardStats(filter: AnalyticsFilterInput): Promise<DashboardStats> {
    // 模拟数据生成
    const totalKeywords = 1250;
    const totalContent = 486;
    const avgSearchVolume = 28500;
    const avgCPC = 2.85;
    const avgSEOScore = 78.5;
    
    const metrics: PerformanceMetric[] = [
      {
        name: '总搜索量',
        value: 35680000,
        previousValue: 32450000,
        changePercent: 9.95,
        trend: 'up',
        unit: ''
      },
      {
        name: '平均排名',
        value: 4.2,
        previousValue: 5.1,
        changePercent: -17.65,
        trend: 'up',  // 排名下降是好事
        unit: ''
      },
      {
        name: '点击率',
        value: 3.8,
        previousValue: 3.2,
        changePercent: 18.75,
        trend: 'up',
        unit: '%'
      },
      {
        name: '转化率',
        value: 2.4,
        previousValue: 2.1,
        changePercent: 14.29,
        trend: 'up',
        unit: '%'
      },
      {
        name: '内容产出',
        value: 156,
        previousValue: 98,
        changePercent: 59.18,
        trend: 'up',
        unit: '篇'
      },
      {
        name: '覆盖率',
        value: 68.5,
        previousValue: 61.2,
        changePercent: 11.93,
        trend: 'up',
        unit: '%'
      }
    ];

    return {
      totalKeywords,
      totalContent,
      avgSearchVolume,
      avgCPC,
      avgSEOScore,
      topPerformingContent: Math.floor(totalContent * 0.15),
      metrics
    };
  }

  async getKeywordDistribution(): Promise<KeywordDistribution[]> {
    const distribution = [
      { priority: 'P0', count: 125, percentage: 10 },
      { priority: 'P1', count: 250, percentage: 20 },
      { priority: 'P2', count: 500, percentage: 40 },
      { priority: 'P3', count: 250, percentage: 20 },
      { priority: 'P4', count: 125, percentage: 10 }
    ];

    return distribution;
  }

  async getContentPerformance(filter: AnalyticsFilterInput): Promise<ContentPerformance[]> {
    const sampleContent = [
      {
        contentId: 'content-1',
        title: 'Eufy Security Camera 完整评测',
        engagementRate: 8.5,
        views: 125680,
        shares: 3420,
        conversionRate: 3.2
      },
      {
        contentId: 'content-2',
        title: '2025年最佳智能家居设备推荐',
        engagementRate: 7.2,
        views: 98450,
        shares: 2180,
        conversionRate: 2.8
      },
      {
        contentId: 'content-3',
        title: 'Eufy vs Arlo：智能监控对比',
        engagementRate: 9.1,
        views: 156320,
        shares: 4560,
        conversionRate: 4.1
      },
      {
        contentId: 'content-4',
        title: '智能门铃安装指南',
        engagementRate: 6.8,
        views: 67890,
        shares: 1230,
        conversionRate: 2.1
      },
      {
        contentId: 'content-5',
        title: 'Eufy机器人吸尘器使用技巧',
        engagementRate: 7.5,
        views: 89760,
        shares: 2340,
        conversionRate: 3.5
      }
    ];

    return sampleContent.sort((a, b) => b.engagementRate - a.engagementRate);
  }

  async getSERPFeatures(): Promise<SERPFeature[]> {
    return [
      {
        feature: '精选摘要',
        frequency: 35.5,
        keywords: ['eufy security camera setup', 'how to install eufy doorbell', 'eufy robot vacuum review']
      },
      {
        feature: '人们也在问',
        frequency: 78.2,
        keywords: ['eufy vs arlo', 'is eufy worth it', 'eufy security camera price']
      },
      {
        feature: '视频结果',
        frequency: 45.8,
        keywords: ['eufy unboxing', 'eufy installation guide', 'eufy review']
      },
      {
        feature: '知识图谱',
        frequency: 22.3,
        keywords: ['eufy company', 'eufy products', 'eufy headquarters']
      },
      {
        feature: '购物结果',
        frequency: 68.9,
        keywords: ['buy eufy camera', 'eufy doorbell price', 'eufy vacuum sale']
      }
    ];
  }

  async getMarketInsights(): Promise<MarketInsight[]> {
    return [
      {
        insight: '智能家居安全设备搜索量增长35%',
        category: '市场趋势',
        importance: '高',
        recommendation: '增加安全相关内容的产出，重点关注隐私保护主题'
      },
      {
        insight: '竞争对手Arlo在视频内容方面领先',
        category: '竞争分析',
        importance: '中',
        recommendation: '加强YouTube和视频内容策略，制作产品对比视频'
      },
      {
        insight: '移动端搜索占比达到68%',
        category: '用户行为',
        importance: '高',
        recommendation: '优化移动端体验，确保内容在手机上的可读性'
      },
      {
        insight: '"AI功能"相关搜索增长120%',
        category: '关键词机会',
        importance: '高',
        recommendation: '创建AI功能专题内容，突出Eufy的AI技术优势'
      },
      {
        insight: '季节性需求：黑五期间搜索量预计增长200%',
        category: '季节趋势',
        importance: '中',
        recommendation: '提前准备促销内容，优化购物相关关键词'
      }
    ];
  }
}

// Resolver
@Resolver()
class AnalyticsResolver {
  constructor(private analyticsService: AnalyticsService) {}

  @Query(() => String)
  async analyticsHealth(): Promise<string> {
    return 'Analytics module is healthy! 📊';
  }

  @Query(() => [KeywordTrend])
  async keywordTrends(
    @Args('filter', { nullable: true, type: () => AnalyticsFilterInput }) filter?: AnalyticsFilterInput
  ): Promise<KeywordTrend[]> {
    return this.analyticsService.getKeywordTrends(filter || {});
  }

  @Query(() => [CompetitorData])
  async competitorAnalysis(): Promise<CompetitorData[]> {
    return this.analyticsService.getCompetitorAnalysis();
  }

  @Query(() => DashboardStats)
  async dashboardStats(
    @Args('filter', { nullable: true, type: () => AnalyticsFilterInput }) filter?: AnalyticsFilterInput
  ): Promise<DashboardStats> {
    return this.analyticsService.getDashboardStats(filter || {});
  }

  @Query(() => [KeywordDistribution])
  async keywordDistribution(): Promise<KeywordDistribution[]> {
    return this.analyticsService.getKeywordDistribution();
  }

  @Query(() => [ContentPerformance])
  async contentPerformance(
    @Args('filter', { nullable: true, type: () => AnalyticsFilterInput }) filter?: AnalyticsFilterInput
  ): Promise<ContentPerformance[]> {
    return this.analyticsService.getContentPerformance(filter || {});
  }

  @Query(() => [SERPFeature])
  async serpFeatures(): Promise<SERPFeature[]> {
    return this.analyticsService.getSERPFeatures();
  }

  @Query(() => [MarketInsight])
  async marketInsights(): Promise<MarketInsight[]> {
    return this.analyticsService.getMarketInsights();
  }
}

// Module
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      introspection: true,
    }),
  ],
  providers: [AnalyticsService, AnalyticsResolver],
})
class AnalyticsModule {}

// Bootstrap
async function bootstrap() {
  const app = await NestFactory.create(AnalyticsModule);
  
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = 4006;
  await app.listen(port);
  
  console.log(`🚀 Analytics API running on http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`📈 Data Analytics & Visualization ready!`);
  console.log(`\n📊 Available Analytics:`);
  console.log(`   - Keyword Trends`);
  console.log(`   - Competitor Analysis`);
  console.log(`   - Performance Metrics`);
  console.log(`   - SERP Features`);
  console.log(`   - Market Insights`);
}

bootstrap();