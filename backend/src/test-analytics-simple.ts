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

// Enums
enum TimeRange {
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
}

registerEnumType(TimeRange, { name: 'TimeRange' });

// Types
@ObjectType()
class TrendDataPoint {
  @Field()
  date: string;

  @Field(() => Float)
  value: number;

  @Field({ nullable: true })
  label?: string;
}

@ObjectType()
class KeywordTrend {
  @Field()
  keyword: string;

  @Field(() => [TrendDataPoint])
  data: TrendDataPoint[];

  @Field(() => Float)
  changePercent: number;

  @Field()
  trending: boolean;
}

@ObjectType()
class CompetitorData {
  @Field()
  competitor: string;

  @Field(() => Float)
  marketShare: number;

  @Field(() => Int)
  keywordCount: number;

  @Field(() => Float)
  avgPosition: number;

  @Field(() => Float)
  visibility: number;
}

@ObjectType()
class PerformanceMetric {
  @Field()
  name: string;

  @Field(() => Float)
  value: number;

  @Field(() => Float)
  previousValue: number;

  @Field(() => Float)
  changePercent: number;

  @Field()
  trend: string;

  @Field()
  unit: string;
}

@ObjectType()
class DashboardStats {
  @Field(() => Int)
  totalKeywords: number;

  @Field(() => Int)
  totalContent: number;

  @Field(() => Float)
  avgSearchVolume: number;

  @Field(() => Float)
  avgCPC: number;

  @Field(() => Float)
  avgSEOScore: number;

  @Field(() => [PerformanceMetric])
  metrics: PerformanceMetric[];
}

// Service
@Injectable()
class AnalyticsService {
  private readonly competitorData = [
    { competitor: 'Arlo', marketShare: 25.5, keywordCount: 450, avgPosition: 3.2, visibility: 78.5 },
    { competitor: 'Ring', marketShare: 22.3, keywordCount: 380, avgPosition: 2.8, visibility: 82.1 },
    { competitor: 'Nest', marketShare: 18.7, keywordCount: 320, avgPosition: 3.5, visibility: 71.3 },
    { competitor: 'Eufy', marketShare: 15.2, keywordCount: 280, avgPosition: 4.1, visibility: 65.8 },
  ];

  private generateTrendData(days: number, baseValue: number): TrendDataPoint[] {
    const data: TrendDataPoint[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // 生成带有趋势和波动的数据
      const trend = (days - i) / days * 0.3;
      const randomness = (Math.random() - 0.5) * 0.2;
      const value = Math.round(baseValue * (1 + trend + randomness));
      
      data.push({
        date: date.toISOString().split('T')[0],
        value,
        label: `${date.getMonth() + 1}/${date.getDate()}`
      });
    }
    
    return data;
  }

  async getKeywordTrends(timeRange: TimeRange = TimeRange.LAST_30_DAYS): Promise<KeywordTrend[]> {
    const days = timeRange === TimeRange.LAST_7_DAYS ? 7 : 
                 timeRange === TimeRange.LAST_90_DAYS ? 90 : 30;
    
    const keywords = ['eufy security camera', 'eufy robot vacuum', 'eufy doorbell', 'eufy smart home'];

    return keywords.map((keyword) => {
      const baseVolume = 10000 + Math.random() * 40000;
      const data = this.generateTrendData(days, baseVolume);
      
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
    return this.competitorData;
  }

  async getDashboardStats(): Promise<DashboardStats> {
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
        trend: 'up',
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
      }
    ];

    return {
      totalKeywords: 1250,
      totalContent: 486,
      avgSearchVolume: 28500,
      avgCPC: 2.85,
      avgSEOScore: 78.5,
      metrics
    };
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
    @Args('timeRange', { nullable: true, type: () => TimeRange }) timeRange?: TimeRange
  ): Promise<KeywordTrend[]> {
    return this.analyticsService.getKeywordTrends(timeRange);
  }

  @Query(() => [CompetitorData])
  async competitorAnalysis(): Promise<CompetitorData[]> {
    return this.analyticsService.getCompetitorAnalysis();
  }

  @Query(() => DashboardStats)
  async dashboardStats(): Promise<DashboardStats> {
    return this.analyticsService.getDashboardStats();
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
  console.log(`   - Dashboard Stats`);
}

bootstrap();