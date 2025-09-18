import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ObjectType, Field, InputType, Int } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { IsString, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';

// Types
enum KeywordPriority {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4'
}

enum KeywordStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT'
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
}

@ObjectType()
class KeywordList {
  @Field(() => [Keyword])
  items: Keyword[] = [];

  @Field()
  total: number = 0;
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
  @IsEnum(KeywordPriority)
  priority?: string;

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
  @IsEnum(KeywordPriority)
  priority?: string;

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
      { text: 'eufy security camera', searchVolume: 50000, cpc: 2.5, priority: 'P0' },
      { text: 'eufy robot vacuum', searchVolume: 40000, cpc: 3.2, priority: 'P0' },
      { text: 'eufy doorbell camera', searchVolume: 30000, cpc: 2.8, priority: 'P1' },
      { text: 'eufy smart home', searchVolume: 25000, cpc: 1.8, priority: 'P1' },
      { text: 'eufy baby monitor', searchVolume: 20000, cpc: 2.2, priority: 'P2' },
    ];

    samples.forEach(sample => {
      const id = `keyword-${this.idCounter++}`;
      this.keywords.set(id, {
        id,
        ...sample,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  }

  async create(input: CreateKeywordInput): Promise<Keyword> {
    const id = `keyword-${this.idCounter++}`;
    const keyword = {
      id,
      text: input.text,
      searchVolume: input.searchVolume || 0,
      cpc: input.cpc || 0,
      priority: input.priority || 'P2',
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

    const total = items.length;

    // Pagination
    const page = input.page || 1;
    const limit = input.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    items = items.slice(start, end);

    return {
      items,
      total,
    };
  }
}

// Resolver
@Resolver()
class KeywordResolver {
  constructor(private keywordService: KeywordService) {}

  @Query(() => String)
  async keywordHealth(): Promise<string> {
    return 'Keyword module is healthy! 🔍';
  }

  @Query(() => Keyword, { nullable: true })
  async keyword(@Args('id') id: string): Promise<Keyword | null> {
    return this.keywordService.findOne(id);
  }

  @Query(() => KeywordList)
  async keywords(@Args('input', { nullable: true }) input?: ListKeywordsInput): Promise<KeywordList> {
    return this.keywordService.findAll(input || {});
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
class KeywordTestModule {}

// Bootstrap
async function bootstrap() {
  const app = await NestFactory.create(KeywordTestModule);
  
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
  
  console.log(`🚀 Keyword CRUD API running on http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`🔍 Keyword management ready with sample data!`);
}

bootstrap();