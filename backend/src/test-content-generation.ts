import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { 
  Resolver, 
  Query, 
  Mutation, 
  Args, 
  ObjectType, 
  Field, 
  InputType, 
  Int,
  registerEnumType 
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { IsString, IsOptional, IsArray, IsEnum, MinLength, MaxLength } from 'class-validator';

// Enums
enum ContentType {
  BLOG_POST = 'BLOG_POST',
  PRODUCT_DESCRIPTION = 'PRODUCT_DESCRIPTION',
  FAQ = 'FAQ',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  EMAIL = 'EMAIL',
  LANDING_PAGE = 'LANDING_PAGE'
}

enum ContentStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED'
}

enum ContentTone {
  PROFESSIONAL = 'PROFESSIONAL',
  CASUAL = 'CASUAL',
  FRIENDLY = 'FRIENDLY',
  TECHNICAL = 'TECHNICAL',
  PERSUASIVE = 'PERSUASIVE'
}

registerEnumType(ContentType, { name: 'ContentType' });
registerEnumType(ContentStatus, { name: 'ContentStatus' });
registerEnumType(ContentTone, { name: 'ContentTone' });

// Types
@ObjectType()
class ContentItem {
  @Field()
  id: string = '';

  @Field()
  title: string = '';

  @Field()
  content: string = '';

  @Field(() => ContentType)
  type: ContentType = ContentType.BLOG_POST;

  @Field(() => ContentStatus)
  status: ContentStatus = ContentStatus.DRAFT;

  @Field(() => ContentTone)
  tone: ContentTone = ContentTone.PROFESSIONAL;

  @Field(() => [String])
  keywords: string[] = [];

  @Field()
  templateId: string = '';

  @Field(() => Int)
  wordCount: number = 0;

  @Field()
  seoScore: number = 0;

  @Field()
  createdAt: Date = new Date();

  @Field()
  updatedAt: Date = new Date();
}

@ObjectType()
class ContentTemplate {
  @Field()
  id: string = '';

  @Field()
  name: string = '';

  @Field()
  description: string = '';

  @Field(() => ContentType)
  type: ContentType = ContentType.BLOG_POST;

  @Field()
  structure: string = '';

  @Field(() => [String])
  prompts: string[] = [];

  @Field()
  isActive: boolean = true;

  @Field()
  createdAt: Date = new Date();
}

@ObjectType()
class GenerationResult {
  @Field()
  success: boolean = false;

  @Field(() => [ContentItem])
  items: ContentItem[] = [];

  @Field()
  message: string = '';
}

@ObjectType()
class ContentAnalysis {
  @Field()
  readabilityScore: number = 0;

  @Field()
  seoScore: number = 0;

  @Field(() => [String])
  suggestions: string[] = [];

  @Field(() => [String])
  missingKeywords: string[] = [];

  @Field()
  estimatedReadTime: number = 0;
}

// Input types
@InputType()
class GenerateContentInput {
  @Field(() => [String])
  @IsArray()
  keywords: string[] = [];

  @Field(() => ContentType)
  @IsEnum(ContentType)
  type: ContentType = ContentType.BLOG_POST;

  @Field(() => ContentTone)
  @IsEnum(ContentTone)
  tone: ContentTone = ContentTone.PROFESSIONAL;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  templateId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  customPrompt?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  targetWordCount?: number = 500;
}

@InputType()
class CreateTemplateInput {
  @Field()
  @IsString()
  name: string = '';

  @Field()
  @IsString()
  description: string = '';

  @Field(() => ContentType)
  @IsEnum(ContentType)
  type: ContentType = ContentType.BLOG_POST;

  @Field()
  @IsString()
  structure: string = '';

  @Field(() => [String])
  @IsArray()
  prompts: string[] = [];
}

@InputType()
class BatchGenerateInput {
  @Field(() => [String])
  @IsArray()
  keywordGroups: string[] = [];

  @Field(() => ContentType)
  @IsEnum(ContentType)
  type: ContentType = ContentType.BLOG_POST;

  @Field(() => ContentTone)
  @IsEnum(ContentTone)
  tone: ContentTone = ContentTone.PROFESSIONAL;

  @Field({ nullable: true })
  @IsOptional()
  templateId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  batchSize?: number = 5;
}

// Service
@Injectable()
class ContentGenerationService {
  private contents = new Map<string, ContentItem>();
  private templates = new Map<string, ContentTemplate>();
  private idCounter = 1;

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        name: 'SEO Blog Post',
        description: '针对搜索引擎优化的博客文章模板',
        type: ContentType.BLOG_POST,
        structure: '# {title}\n\n## 引言\n{introduction}\n\n## 主要内容\n{main_content}\n\n## 总结\n{conclusion}\n\n## 常见问题\n{faq}',
        prompts: [
          '创建一个吸引人的标题，包含主要关键词',
          '写一个引人入胜的开头段落，说明文章的价值',
          '详细解释主题，使用副标题组织内容',
          '总结关键要点，并包含行动号召',
          '添加3-5个相关的常见问题'
        ]
      },
      {
        name: 'Product Description',
        description: '产品描述模板，突出特性和优势',
        type: ContentType.PRODUCT_DESCRIPTION,
        structure: '## 产品概述\n{overview}\n\n## 主要特性\n{features}\n\n## 技术规格\n{specs}\n\n## 用户评价\n{reviews}',
        prompts: [
          '简要介绍产品及其主要用途',
          '列出3-5个核心特性和优势',
          '提供详细的技术规格',
          '包含用户推荐或评价'
        ]
      },
      {
        name: 'Social Media Post',
        description: '社交媒体帖子模板',
        type: ContentType.SOCIAL_MEDIA,
        structure: '{hook}\n\n{main_message}\n\n{hashtags}\n\n{cta}',
        prompts: [
          '创建一个吸引眼球的开头',
          '传达核心信息',
          '添加相关话题标签',
          '包含明确的行动号召'
        ]
      }
    ];

    defaultTemplates.forEach(template => {
      const id = `template-${this.idCounter++}`;
      this.templates.set(id, {
        id,
        ...template,
        isActive: true,
        createdAt: new Date()
      });
    });
  }

  // AI 内容生成模拟
  private simulateAIGeneration(keywords: string[], type: ContentType, tone: ContentTone, _wordCount: number): string {
    const toneStyles = {
      [ContentTone.PROFESSIONAL]: '专业且权威的',
      [ContentTone.CASUAL]: '轻松友好的',
      [ContentTone.FRIENDLY]: '亲切温暖的',
      [ContentTone.TECHNICAL]: '技术性强的',
      [ContentTone.PERSUASIVE]: '有说服力的'
    };

    const typeFormats = {
      [ContentType.BLOG_POST]: `
# ${keywords[0]} - 完整指南

## 引言
在当今数字化时代，${keywords[0]}变得越来越重要。本文将以${toneStyles[tone]}方式，深入探讨${keywords.join('、')}等关键概念。

## 什么是${keywords[0]}？
${keywords[0]}是指...（这里将详细解释核心概念）

## ${keywords[0]}的主要优势
1. **提高效率**: 通过使用${keywords[0]}，您可以...
2. **节省成本**: 研究表明...
3. **改善体验**: 用户反馈显示...

## 如何开始使用${keywords[0]}
### 步骤1: 准备工作
首先，您需要了解${keywords[1] || keywords[0]}的基础知识...

### 步骤2: 实施计划
制定一个包含${keywords.join('和')}的综合策略...

### 步骤3: 优化和迭代
持续监控和改进您的${keywords[0]}实践...

## 常见问题解答
**Q: ${keywords[0]}适合所有人吗？**
A: 虽然${keywords[0]}具有广泛的适用性，但具体情况需要...

**Q: 需要多长时间才能看到效果？**
A: 通常情况下，实施${keywords[0]}后的3-6个月内...

## 总结
${keywords[0]}是现代${keywords[1] ? `${keywords[1]}领域` : '业务'}中不可或缺的一部分。通过正确的方法和持续的努力，您可以充分发挥其潜力。

立即开始您的${keywords[0]}之旅，体验它带来的变革！
`,
      [ContentType.PRODUCT_DESCRIPTION]: `
## ${keywords[0]} - 革新您的体验

### 产品概述
${keywords[0]}是一款专为现代用户设计的创新产品，完美融合了${keywords.slice(1).join('、')}等先进技术。

### 核心特性
✓ **智能${keywords[1] || '功能'}**: 自动适应您的需求
✓ **高效性能**: 比传统方案快3倍
✓ **用户友好**: 直观的界面设计
✓ **可靠耐用**: 经过严格测试认证

### 为什么选择我们的${keywords[0]}？
- 行业领先的技术
- 24/7专业支持
- 30天无理由退款保证
- 超过10万满意用户

立即购买，享受限时优惠！
`,
      [ContentType.FAQ]: `
## ${keywords[0]} 常见问题解答

**1. 什么是${keywords[0]}？**
${keywords[0]}是一种${keywords[1] ? `结合了${keywords[1]}的` : ''}解决方案...

**2. ${keywords[0]}如何工作？**
通过先进的技术...

**3. 谁需要${keywords[0]}？**
任何希望改善${keywords[1] || '效率'}的个人或企业...

**4. 使用${keywords[0]}的成本是多少？**
我们提供灵活的定价方案...

**5. 如何开始使用？**
只需简单的三个步骤...
`,
      [ContentType.SOCIAL_MEDIA]: `
🚀 发现${keywords[0]}的力量！

您还在为${keywords[1] || '效率'}问题烦恼吗？

✨ ${keywords[0]}帮助您：
• 节省70%的时间
• 提升200%的效果
• 获得即时结果

🎯 加入10万+用户的选择！

#${keywords.join(' #')} #创新科技 #提升效率

👉 点击链接，立即体验：[link]
`,
      [ContentType.EMAIL]: `
主题：${keywords[0]} - 为您量身定制的解决方案

尊敬的用户，

您是否正在寻找更好的${keywords[0]}方案？

我们很高兴向您介绍我们的最新产品，它完美结合了${keywords.join('和')}的优势。

**为什么选择我们？**
• 经过验证的结果
• 简单易用的界面
• 专业的客户支持

**限时优惠**
现在注册即可享受首月免费试用！

不要错过这个机会，立即行动！

祝好，
Eufy GEO 团队
`,
      [ContentType.LANDING_PAGE]: `
# ${keywords[0]} - 您的成功之选

## 改变游戏规则的${keywords[0]}解决方案

### 为什么选择我们？
- ✅ 行业领先技术
- ✅ 简单三步开始
- ✅ 100%满意保证

### 客户见证
"使用${keywords[0]}后，我们的效率提升了300%！" - 张经理

### 立即开始
输入您的邮箱，获取免费试用：[表单]

### 信任保证
- 🔒 安全加密
- 🏆 行业认证
- 💰 无风险试用
`
    };

    return typeFormats[type] || typeFormats[ContentType.BLOG_POST];
  }

  async generateContent(input: GenerateContentInput): Promise<ContentItem> {
    const id = `content-${this.idCounter++}`;
    
    // 模拟 AI 生成内容
    const generatedContent = this.simulateAIGeneration(
      input.keywords,
      input.type,
      input.tone,
      input.targetWordCount || 500
    );

    const content: ContentItem = {
      id,
      title: `${input.keywords[0]} - AI 生成的${input.type}`,
      content: generatedContent,
      type: input.type,
      status: ContentStatus.DRAFT,
      tone: input.tone,
      keywords: input.keywords,
      templateId: input.templateId || '',
      wordCount: generatedContent.split(/\s+/).length,
      seoScore: this.calculateSEOScore(generatedContent, input.keywords),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.contents.set(id, content);
    return content;
  }

  async batchGenerate(input: BatchGenerateInput): Promise<GenerationResult> {
    const results: ContentItem[] = [];
    
    try {
      // 限制批次大小
      const batchSize = Math.min(input.batchSize || 5, 10);
      const keywordGroups = input.keywordGroups.slice(0, batchSize);

      for (const keywordGroup of keywordGroups) {
        const keywords = keywordGroup.split(',').map(k => k.trim());
        const generateInput: GenerateContentInput = {
          keywords,
          type: input.type,
          tone: input.tone,
          targetWordCount: 500
        };
        if (input.templateId) {
          generateInput.templateId = input.templateId;
        }
        const content = await this.generateContent(generateInput);
        results.push(content);
      }

      return {
        success: true,
        items: results,
        message: `成功生成 ${results.length} 个内容项`
      };
    } catch (error) {
      return {
        success: false,
        items: results,
        message: `批量生成失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  async analyzeContent(contentId: string): Promise<ContentAnalysis | null> {
    const content = this.contents.get(contentId);
    if (!content) return null;

    const text = content.content;
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/);
    
    // 计算可读性分数（简化版）
    const avgWordsPerSentence = words.length / sentences.length;
    const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 5));

    // SEO 分数
    const seoScore = this.calculateSEOScore(text, content.keywords);

    // 检查缺失的关键词
    const missingKeywords = content.keywords.filter(
      keyword => !text.toLowerCase().includes(keyword.toLowerCase())
    );

    // 改进建议
    const suggestions: string[] = [];
    if (avgWordsPerSentence > 20) {
      suggestions.push('句子过长，建议拆分成更短的句子以提高可读性');
    }
    if (content.wordCount < 300) {
      suggestions.push('内容过短，建议扩充到至少300字以提高SEO效果');
    }
    if (missingKeywords.length > 0) {
      suggestions.push(`建议在内容中包含这些关键词: ${missingKeywords.join(', ')}`);
    }
    if (!text.includes('#') && content.type === ContentType.BLOG_POST) {
      suggestions.push('建议添加副标题以改善内容结构');
    }

    return {
      readabilityScore,
      seoScore,
      suggestions,
      missingKeywords,
      estimatedReadTime: Math.ceil(words.length / 200) // 假设每分钟阅读200字
    };
  }

  private calculateSEOScore(content: string, keywords: string[]): number {
    let score = 50; // 基础分数
    const lowerContent = content.toLowerCase();

    // 检查关键词密度
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const occurrences = (lowerContent.match(new RegExp(keywordLower, 'g')) || []).length;
      
      if (occurrences > 0) {
        score += 10;
        // 理想密度是1-3%
        const density = (occurrences * keyword.length) / content.length * 100;
        if (density >= 1 && density <= 3) {
          score += 5;
        }
      }
    });

    // 检查标题
    if (content.includes('#')) score += 5;
    
    // 检查内容长度
    if (content.length > 1500) score += 10;
    if (content.length > 3000) score += 5;

    // 检查列表
    if (content.includes('•') || content.includes('1.')) score += 5;

    return Math.min(100, score);
  }

  async createTemplate(input: CreateTemplateInput): Promise<ContentTemplate> {
    const id = `template-${this.idCounter++}`;
    const template: ContentTemplate = {
      id,
      ...input,
      isActive: true,
      createdAt: new Date()
    };

    this.templates.set(id, template);
    return template;
  }

  async getTemplates(): Promise<ContentTemplate[]> {
    return Array.from(this.templates.values()).filter(t => t.isActive);
  }

  async getContent(id: string): Promise<ContentItem | null> {
    return this.contents.get(id) || null;
  }

  async getContents(): Promise<ContentItem[]> {
    return Array.from(this.contents.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateContentStatus(id: string, status: ContentStatus): Promise<ContentItem | null> {
    const content = this.contents.get(id);
    if (!content) return null;

    content.status = status;
    content.updatedAt = new Date();
    return content;
  }
}

// Resolver
@Resolver()
class ContentGenerationResolver {
  constructor(private contentService: ContentGenerationService) {}

  @Query(() => String)
  async contentHealth(): Promise<string> {
    return 'Content Generation module is healthy! ✍️';
  }

  @Mutation(() => ContentItem)
  async generateContent(@Args('input') input: GenerateContentInput): Promise<ContentItem> {
    return this.contentService.generateContent(input);
  }

  @Mutation(() => GenerationResult)
  async batchGenerateContent(@Args('input') input: BatchGenerateInput): Promise<GenerationResult> {
    return this.contentService.batchGenerate(input);
  }

  @Query(() => ContentAnalysis, { nullable: true })
  async analyzeContent(@Args('contentId') contentId: string): Promise<ContentAnalysis | null> {
    return this.contentService.analyzeContent(contentId);
  }

  @Mutation(() => ContentTemplate)
  async createTemplate(@Args('input') input: CreateTemplateInput): Promise<ContentTemplate> {
    return this.contentService.createTemplate(input);
  }

  @Query(() => [ContentTemplate])
  async templates(): Promise<ContentTemplate[]> {
    return this.contentService.getTemplates();
  }

  @Query(() => ContentItem, { nullable: true })
  async content(@Args('id') id: string): Promise<ContentItem | null> {
    return this.contentService.getContent(id);
  }

  @Query(() => [ContentItem])
  async contents(): Promise<ContentItem[]> {
    return this.contentService.getContents();
  }

  @Mutation(() => ContentItem, { nullable: true })
  async updateContentStatus(
    @Args('id') id: string,
    @Args('status', { type: () => ContentStatus }) status: ContentStatus
  ): Promise<ContentItem | null> {
    return this.contentService.updateContentStatus(id, status);
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
  providers: [ContentGenerationService, ContentGenerationResolver],
})
class ContentGenerationModule {}

// Bootstrap
async function bootstrap() {
  const app = await NestFactory.create(ContentGenerationModule);
  
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = 4005;
  await app.listen(port);
  
  console.log(`🚀 Content Generation API running on http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`✍️  AI Content Generation ready!`);
  console.log(`\n📝 默认模板已加载:`);
  console.log(`   - SEO Blog Post`);
  console.log(`   - Product Description`);
  console.log(`   - Social Media Post`);
}

bootstrap();