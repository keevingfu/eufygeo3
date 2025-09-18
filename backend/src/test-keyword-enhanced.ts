import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ObjectType, Field, InputType, Int } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { IsString, IsOptional, IsNumber, Min, Max, IsEnum, IsBoolean } from 'class-validator';
import { KeywordGradingService } from './services/keyword-grading.service';
import { AIOAdaptabilityService } from './services/aio-adaptability.service';

enum KeywordStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT'
}

@ObjectType()
class PriorityInfo {
  @Field()
  level: string = '';

  @Field()
  minVolume: number = 0;

  @Field(() => Int, { nullable: true })
  maxVolume: number | null = null;

  @Field()
  description: string = '';

  @Field()
  resourceAllocation: string = '';
}

@ObjectType()
class AIOFactors {
  @Field()
  questionTypeMatch: number = 0;

  @Field()
  searchIntentClarity: number = 0;

  @Field()
  contentStructure: number = 0;

  @Field()
  competitiveEnvironment: number = 0;
}

@ObjectType()
class AIOAnalysis {
  @Field()
  score: number = 0;

  @Field(() => AIOFactors)
  factors: AIOFactors = new AIOFactors();

  @Field(() => [String])
  recommendations: string[] = [];

  @Field()
  predictedPerformance: string = '';
}

@ObjectType()
class Keyword {
  @Field()
  id: string = '';

  @Field()
  text: string = '';

  @Field()
  searchVolume: number = 0;

  @Field()
  cpc: number = 0;

  @Field()
  priority: string = '';

  @Field()
  status: string = '';

  @Field()
  createdAt: Date = new Date();

  @Field()
  updatedAt: Date = new Date();

  // 新增字段
  @Field(() => PriorityInfo, { nullable: true })
  priorityInfo: PriorityInfo | null = null;

  @Field()
  aioScore: number = 0;

  @Field(() => AIOAnalysis, { nullable: true })
  aioAnalysis: AIOAnalysis | null = null;
}

@ObjectType()
class KeywordList {
  @Field(() => [Keyword])
  items: Keyword[] = [];

  @Field()
  total: number = 0;
}

@ObjectType()
class PriorityDistribution {
  @Field()
  P0: number = 0;

  @Field()
  P1: number = 0;

  @Field()
  P2: number = 0;

  @Field()
  P3: number = 0;

  @Field()
  P4: number = 0;

  @Field()
  P5: number = 0;

  @Field()
  total: number = 0;
}

@ObjectType()
class PriorityDistributionPercentages {
  @Field()
  P0: string = '';

  @Field()
  P1: string = '';

  @Field()
  P2: string = '';

  @Field()
  P3: string = '';

  @Field()
  P4: string = '';

  @Field()
  P5: string = '';
}

@ObjectType()
class KeywordDistribution {
  @Field(() => PriorityDistribution)
  counts: PriorityDistribution = new PriorityDistribution();

  @Field(() => PriorityDistributionPercentages)
  percentages: PriorityDistributionPercentages = new PriorityDistributionPercentages();
}

@InputType()
class CreateKeywordInput {
  @Field()
  @IsString()
  text: string = '';

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  searchVolume?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cpc?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(KeywordStatus)
  status?: string;
}

@InputType()
class UpdateKeywordInput {
  @Field()
  id: string = '';

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  text?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  searchVolume?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cpc?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(KeywordStatus)
  status?: string;
}

@InputType()
class ListKeywordsInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @Field({ nullable: true })
  @IsOptional()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  priority?: string;

  @Field({ nullable: true })
  @IsOptional()
  status?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(100)
  minAioScore?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeAnalysis?: boolean = false;
}

@InputType()
class BatchUpdatePrioritiesInput {
  @Field(() => [String])
  keywordIds: string[] = [];

  @Field()
  @IsBoolean()
  recalculate: boolean = true;
}

// Service
@Injectable()
class KeywordService {
  private keywords = new Map<string, any>();
  private idCounter = 1;

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const samples = [
      { text: 'how to install eufy security camera', searchVolume: 120000, cpc: 2.5 },
      { text: 'eufy robot vacuum review', searchVolume: 85000, cpc: 3.2 },
      { text: 'eufy doorbell vs ring', searchVolume: 65000, cpc: 2.8 },
      { text: 'what is eufy smart home', searchVolume: 45000, cpc: 1.8 },
      { text: 'eufy baby monitor setup guide', searchVolume: 25000, cpc: 2.2 },
      { text: 'best eufy security system', searchVolume: 18000, cpc: 3.5 },
      { text: 'eufy camera troubleshooting', searchVolume: 12000, cpc: 1.5 },
      { text: 'eufy vacuum cleaner parts', searchVolume: 8000, cpc: 2.0 },
      { text: 'eufy home security tips', searchVolume: 4500, cpc: 1.2 },
      { text: 'eufy app not working', searchVolume: 3000, cpc: 0.8 },
    ];

    samples.forEach(sample => {
      const id = `keyword-${this.idCounter++}`;
      
      // 自动计算优先级
      const priority = KeywordGradingService.calculatePriority(sample.searchVolume);
      const priorityData = KeywordGradingService.getPriorityInfo(priority);
      
      // 计算AIO适配性
      const aioAnalysis = AIOAdaptabilityService.calculateAIOScore(sample.text);
      
      const priorityInfo = priorityData ? {
        level: priorityData.level,
        minVolume: priorityData.minVolume,
        maxVolume: priorityData.maxVolume || null,
        description: priorityData.description,
        resourceAllocation: priorityData.resourceAllocation,
      } : null;
      
      this.keywords.set(id, {
        id,
        ...sample,
        priority,
        priorityInfo,
        aioScore: aioAnalysis.score,
        aioAnalysis: aioAnalysis || null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  async create(input: CreateKeywordInput): Promise<Keyword> {
    const id = `keyword-${this.idCounter++}`;
    
    // 自动计算优先级
    const searchVolume = input.searchVolume || 0;
    const priority = KeywordGradingService.calculatePriority(searchVolume);
    const priorityData = KeywordGradingService.getPriorityInfo(priority);
    
    // 计算AIO适配性
    const aioAnalysis = AIOAdaptabilityService.calculateAIOScore(input.text);
    
    const priorityInfo = priorityData ? {
      level: priorityData.level,
      minVolume: priorityData.minVolume,
      maxVolume: priorityData.maxVolume || null,
      description: priorityData.description,
      resourceAllocation: priorityData.resourceAllocation,
    } : null;
    
    const keyword = {
      id,
      text: input.text,
      searchVolume,
      cpc: input.cpc || 0,
      priority,
      priorityInfo,
      aioScore: aioAnalysis.score,
      aioAnalysis: aioAnalysis || null,
      status: input.status || 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.keywords.set(id, keyword);
    return keyword;
  }

  async update(input: UpdateKeywordInput): Promise<Keyword> {
    const keyword = this.keywords.get(input.id);
    if (!keyword) {
      throw new Error('Keyword not found');
    }

    const updated = {
      ...keyword,
      ...input,
      updatedAt: new Date(),
    };

    // 如果搜索量更新了，重新计算优先级
    if (input.searchVolume !== undefined) {
      updated.priority = KeywordGradingService.calculatePriority(input.searchVolume);
      const priorityData = KeywordGradingService.getPriorityInfo(updated.priority);
      updated.priorityInfo = priorityData ? {
        level: priorityData.level,
        minVolume: priorityData.minVolume,
        maxVolume: priorityData.maxVolume || null,
        description: priorityData.description,
        resourceAllocation: priorityData.resourceAllocation,
      } : null;
    }

    // 如果关键词文本更新了，重新计算AIO分数
    if (input.text !== undefined) {
      const aioAnalysis = AIOAdaptabilityService.calculateAIOScore(input.text);
      updated.aioScore = aioAnalysis.score;
      updated.aioAnalysis = aioAnalysis || null;
    }

    this.keywords.set(input.id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.keywords.has(id)) {
      throw new Error('Keyword not found');
    }
    return this.keywords.delete(id);
  }

  async findOne(id: string): Promise<Keyword | null> {
    return this.keywords.get(id) || null;
  }

  async findAll(input: ListKeywordsInput): Promise<KeywordList> {
    let items = Array.from(this.keywords.values());

    // Filter by search text
    if (input.search) {
      const search = input.search.toLowerCase();
      items = items.filter(k => k.text.toLowerCase().includes(search));
    }

    // Filter by priority
    if (input.priority) {
      items = items.filter(k => k.priority === input.priority);
    }

    // Filter by status
    if (input.status) {
      items = items.filter(k => k.status === input.status);
    }

    // Filter by minimum AIO score
    if (input.minAioScore !== undefined && input.minAioScore !== null) {
      items = items.filter(k => k.aioScore >= input.minAioScore!);
    }

    const total = items.length;

    // Sort by search volume (descending)
    items.sort((a, b) => b.searchVolume - a.searchVolume);

    // Pagination
    const page = input.page || 1;
    const limit = input.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    items = items.slice(start, end);

    // Remove detailed analysis if not requested
    if (!input.includeAnalysis) {
      items = items.map(item => ({
        ...item,
        aioAnalysis: null,
        priorityInfo: null,
      }));
    }

    return {
      items,
      total,
    };
  }

  async getPriorityDistribution(): Promise<KeywordDistribution> {
    const allKeywords = Array.from(this.keywords.values());
    const distribution = KeywordGradingService.getPriorityDistribution(allKeywords);
    
    return {
      counts: {
        P0: distribution.P0,
        P1: distribution.P1,
        P2: distribution.P2,
        P3: distribution.P3,
        P4: distribution.P4,
        P5: distribution.P5,
        total: distribution.total,
      },
      percentages: distribution.percentages as PriorityDistributionPercentages,
    };
  }

  async batchUpdatePriorities(input: BatchUpdatePrioritiesInput): Promise<Keyword[]> {
    const updatedKeywords: Keyword[] = [];

    for (const id of input.keywordIds) {
      const keyword = this.keywords.get(id);
      if (keyword) {
        const priority = KeywordGradingService.calculatePriority(keyword.searchVolume);
        const priorityInfo = KeywordGradingService.getPriorityInfo(priority);
        
        keyword.priority = priority;
        keyword.priorityInfo = priorityInfo ? {
          level: priorityInfo.level,
          minVolume: priorityInfo.minVolume,
          maxVolume: priorityInfo.maxVolume || null,
          description: priorityInfo.description,
          resourceAllocation: priorityInfo.resourceAllocation,
        } : null;
        keyword.updatedAt = new Date();
        
        this.keywords.set(id, keyword);
        updatedKeywords.push(keyword);
      }
    }

    return updatedKeywords;
  }

  async analyzeKeywordBatch(keywordIds: string[]): Promise<any[]> {
    const results = [];
    
    for (const id of keywordIds) {
      const keyword = this.keywords.get(id);
      if (keyword) {
        const aioAnalysis = AIOAdaptabilityService.calculateAIOScore(keyword.text);
        results.push({
          id: keyword.id,
          keyword: keyword.text,
          aioScore: aioAnalysis.score,
          analysis: aioAnalysis,
        });
      }
    }
    
    return results;
  }
}

// Resolver
@Resolver()
class KeywordResolver {
  constructor(private keywordService: KeywordService) {}

  @Query(() => String)
  async keywordHealth(): Promise<string> {
    return 'Enhanced Keyword module with P0-P5 grading and AIO scoring! 🚀';
  }

  @Query(() => Keyword, { nullable: true })
  async keyword(@Args('id') id: string): Promise<Keyword | null> {
    return this.keywordService.findOne(id);
  }

  @Query(() => KeywordList)
  async keywords(@Args('input', { nullable: true }) input?: ListKeywordsInput): Promise<KeywordList> {
    return this.keywordService.findAll(input || {});
  }

  @Query(() => KeywordDistribution)
  async keywordPriorityDistribution(): Promise<KeywordDistribution> {
    return this.keywordService.getPriorityDistribution();
  }

  @Query(() => [PriorityInfo])
  async priorityConfiguration(): Promise<PriorityInfo[]> {
    const config = KeywordGradingService.getPriorityConfiguration();
    return config.map(c => ({
      level: c.level,
      minVolume: c.minVolume,
      maxVolume: c.maxVolume || null,
      description: c.description,
      resourceAllocation: c.resourceAllocation,
    }));
  }

  @Mutation(() => Keyword)
  async createKeyword(@Args('input') input: CreateKeywordInput): Promise<Keyword> {
    return this.keywordService.create(input);
  }

  @Mutation(() => Keyword)
  async updateKeyword(@Args('input') input: UpdateKeywordInput): Promise<Keyword> {
    return this.keywordService.update(input);
  }

  @Mutation(() => Boolean)
  async deleteKeyword(@Args('id') id: string): Promise<boolean> {
    return this.keywordService.delete(id);
  }

  @Mutation(() => [Keyword])
  async batchUpdatePriorities(@Args('input') input: BatchUpdatePrioritiesInput): Promise<Keyword[]> {
    return this.keywordService.batchUpdatePriorities(input);
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
  providers: [KeywordService, KeywordResolver],
})
class KeywordEnhancedModule {}

// Bootstrap
async function bootstrap() {
  const app = await NestFactory.create(KeywordEnhancedModule);
  
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = 4004;
  await app.listen(port);
  
  console.log(`🚀 Enhanced Keyword API running on http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`🎯 Features: P0-P5 Auto-grading | AIO Adaptability Scoring`);
  console.log(`📈 Sample keywords with automatic priority and AIO analysis loaded!`);
}

bootstrap();