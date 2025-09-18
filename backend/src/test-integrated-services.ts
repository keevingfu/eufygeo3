import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSchema } from 'type-graphql';
import { Field, ObjectType, InputType, Resolver, Query, Mutation, Arg, Int } from 'type-graphql';
import { GoogleApisService } from './services/google-apis.service';
import { ContentOutlineService } from './services/content-outline.service';
import { ChannelManagementService } from './services/channel-management.service';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// GraphQL 类型定义
@ObjectType()
class SearchResult {
  @Field()
  keyword: string;

  @Field({ nullable: true })
  total_results?: string;

  @Field(() => [OrganicResult])
  organic_results: OrganicResult[];

  @Field(() => [String])
  people_also_ask: string[];

  @Field(() => [String])
  related_searches: string[];
}

@ObjectType()
class OrganicResult {
  @Field(() => Int)
  position: number;

  @Field()
  title: string;

  @Field()
  link: string;

  @Field({ nullable: true })
  snippet?: string;

  @Field()
  domain: string;
}

@ObjectType()
class ContentOutline {
  @Field()
  title: string;

  @Field()
  meta_description: string;

  @Field()
  target_keyword: string;

  @Field(() => Int)
  word_count: number;

  @Field(() => [OutlineSection])
  sections: OutlineSection[];

  @Field(() => [String])
  keywords_to_include: string[];

  @Field(() => [String])
  questions_to_answer: string[];
}

@ObjectType()
class OutlineSection {
  @Field()
  heading: string;

  @Field(() => Int)
  level: number;

  @Field(() => [String])
  content_points: string[];

  @Field(() => [String])
  keywords: string[];

  @Field(() => Int)
  word_count_estimate: number;
}

@ObjectType()
class ChannelOptimization {
  @Field()
  channel: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => [String], { nullable: true })
  recommendations?: string[];

  @Field({ nullable: true })
  bestPostTime?: string;
}

@ObjectType()
class KeywordTrends {
  @Field()
  keyword: string;

  @Field(() => [TrendData])
  trend_data: TrendData[];
}

@ObjectType()
class TrendData {
  @Field()
  date: string;

  @Field(() => Int)
  value: number;
}

@ObjectType()
class CompetitorAnalysis {
  @Field()
  domain: string;

  @Field(() => Int)
  indexed_pages: number;

  @Field(() => Int)
  total_backlinks: number;

  @Field(() => [String])
  top_pages: string[];
}

@InputType()
class ContentInput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  keyword: string;

  @Field({ nullable: true })
  type?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}

// GraphQL Resolver
@Resolver()
class IntegratedServicesResolver {
  private googleApisService: GoogleApisService;
  private contentOutlineService: ContentOutlineService;
  private channelManagementService: ChannelManagementService;
  private configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
    this.googleApisService = new GoogleApisService(this.configService);
    this.contentOutlineService = new ContentOutlineService(
      this.configService,
      this.googleApisService
    );
    this.channelManagementService = new ChannelManagementService(this.configService);
  }

  @Query(() => SearchResult)
  async searchKeyword(@Arg('keyword') keyword: string): Promise<SearchResult> {
    const data = await this.googleApisService.searchKeywordData(keyword);
    return {
      keyword: keyword,
      total_results: data.total_results,
      organic_results: data.organic_results || [],
      people_also_ask: data.people_also_ask?.map((q: any) => q.question) || [],
      related_searches: data.related_searches?.map((s: any) => s.query) || []
    };
  }

  @Query(() => KeywordTrends)
  async getKeywordTrends(
    @Arg('keyword') keyword: string,
    @Arg('timeRange', { defaultValue: 'today 12-m' }) timeRange: string
  ): Promise<KeywordTrends> {
    const trends = await this.googleApisService.getKeywordTrends([keyword], timeRange);
    return {
      keyword: keyword,
      trend_data: trends.interest_over_time?.timeline_data?.map((item: any) => ({
        date: item.date,
        value: item.values?.[0]?.extracted_value || 0
      })) || []
    };
  }

  @Query(() => CompetitorAnalysis)
  async analyzeCompetitor(@Arg('domain') domain: string): Promise<CompetitorAnalysis> {
    const analysis = await this.googleApisService.getCompetitorAnalysis(domain);
    return {
      domain: domain,
      indexed_pages: analysis.indexed_pages || 0,
      total_backlinks: analysis.backlinks?.total_backlinks || 0,
      top_pages: analysis.top_pages?.map((p: any) => p.title) || []
    };
  }

  @Mutation(() => ContentOutline)
  async generateContentOutline(
    @Arg('keyword') keyword: string,
    @Arg('contentType', { defaultValue: 'blog' }) contentType: string
  ): Promise<ContentOutline> {
    const outline = await this.contentOutlineService.generateContentOutline(keyword, contentType);
    return {
      title: outline.title,
      meta_description: outline.meta_description,
      target_keyword: outline.target_keyword,
      word_count: outline.word_count,
      sections: outline.sections,
      keywords_to_include: outline.keywords_to_include,
      questions_to_answer: outline.questions_to_answer
    };
  }

  @Query(() => ChannelOptimization)
  async optimizeForChannel(
    @Arg('content', () => ContentInput) content: ContentInput,
    @Arg('channel') channel: string
  ): Promise<ChannelOptimization> {
    let optimization: any;

    switch (channel.toLowerCase()) {
      case 'google':
        optimization = await this.channelManagementService.optimizeForGoogleSearch(content);
        return {
          channel: 'google',
          title: optimization.title?.optimized,
          description: optimization.metaDescription?.optimized,
          recommendations: [
            ...optimization.title?.suggestions || [],
            ...optimization.metaDescription?.suggestions || []
          ]
        };

      case 'youtube':
        optimization = await this.channelManagementService.optimizeForYouTube(content);
        return {
          channel: 'youtube',
          title: optimization.title?.optimized,
          description: optimization.description,
          tags: optimization.tags,
          recommendations: optimization.title?.suggestions || []
        };

      case 'reddit':
        const subreddit = content.tags?.[0] || 'technology';
        optimization = await this.channelManagementService.optimizeForReddit(content, subreddit);
        return {
          channel: 'reddit',
          title: optimization.title?.original,
          recommendations: [
            ...optimization.title?.suggestions || [],
            ...optimization.engagementTips || []
          ],
          bestPostTime: `Best time: ${optimization.postTiming?.bestHours?.[0] || 'N/A'}`
        };

      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  @Query(() => String)
  async healthCheck(): Promise<string> {
    return 'Integrated Services API is running!';
  }
}

// 启动服务器
async function bootstrap() {
  try {
    // 构建 GraphQL schema
    const schema = await buildSchema({
      resolvers: [IntegratedServicesResolver],
      validate: false,
    });

    // 创建 Apollo Server
    const server = new ApolloServer({
      schema,
      introspection: true,
    });

    // 启动服务器
    const { url } = await startStandaloneServer(server, {
      listen: { port: 4006 },
      context: async () => ({}),
    });

    console.log(`🚀 Integrated Services API ready at ${url}`);
    console.log(`
Available endpoints:
- Search Keyword Data: searchKeyword(keyword: String!)
- Get Keyword Trends: getKeywordTrends(keyword: String!, timeRange: String)
- Analyze Competitor: analyzeCompetitor(domain: String!)
- Generate Content Outline: generateContentOutline(keyword: String!, contentType: String)
- Optimize for Channel: optimizeForChannel(content: ContentInput!, channel: String!)

Try the GraphQL playground at ${url}
    `);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 运行应用
bootstrap();