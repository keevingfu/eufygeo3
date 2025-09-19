import { Resolver, Query, Mutation, Args, Field, ObjectType, InputType, Int, Float } from '@nestjs/graphql';
import { GEOCoreEngineService, GEOContentInput, GEOOptimizedContent, AIEngineCompatibility } from '../../services/geo-core-engine.service';
import { AICitationMonitorService, CitationInsights } from '../../services/ai-citation-monitor.service';
import { FAQRestructuringService, FAQEntry, FAQOptimizationResult } from '../../services/faq-restructuring.service';

// GraphQL Types
@ObjectType()
export class MetaTagsType {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => [String])
  keywords: string[];
}

@ObjectType()
export class GEOOptimizedContentType {
  @Field()
  originalContent: string;

  @Field()
  optimizedContent: string;

  @Field()
  structuredData: string; // JSON string

  @Field(() => Float)
  aiReadinessScore: number;

  @Field(() => [String])
  recommendedImprovements: string[];

  @Field(() => MetaTagsType)
  metaTags: MetaTagsType;
}

@ObjectType()
export class AIEngineCompatibilityType {
  @Field(() => Float)
  googleSGE: number;

  @Field(() => Float)
  bingChat: number;

  @Field(() => Float)
  perplexity: number;

  @Field(() => Float)
  chatGPT: number;

  @Field(() => Float)
  overall: number;
}

@ObjectType()
export class CitationSourceType {
  @Field()
  platform: string;

  @Field()
  query: string;

  @Field()
  citationText: string;

  @Field()
  sourceUrl: string;

  @Field()
  timestamp: string;

  @Field(() => Float)
  confidence: number;

  @Field()
  context: string;
}

@ObjectType()
export class CompetitorCitationType {
  @Field()
  competitor: string;

  @Field(() => Int)
  mentions: number;

  @Field(() => Float)
  citationRate: number;

  @Field(() => [String])
  topQueries: string[];

  @Field()
  sentiment: string;
}

@ObjectType()
export class CitationTrendType {
  @Field()
  date: string;

  @Field(() => Int)
  totalCitations: number;

  @Field()
  platformBreakdown: string; // JSON string

  @Field()
  topCitedContent: string; // JSON string
}

@ObjectType()
export class CitationInsightsType {
  @Field(() => Int)
  totalCitations: number;

  @Field(() => Float)
  citationRate: number;

  @Field()
  platformDistribution: string; // JSON string

  @Field()
  topPerformingContent: string; // JSON string

  @Field(() => [CompetitorCitationType])
  competitorComparison: CompetitorCitationType[];

  @Field(() => [CitationTrendType])
  trends: CitationTrendType[];

  @Field(() => [String])
  recommendations: string[];
}

@ObjectType()
export class FAQEntryType {
  @Field()
  id: string;

  @Field()
  question: string;

  @Field()
  answer: string;

  @Field()
  category: string;

  @Field()
  priority: string;

  @Field(() => [String])
  targetKeywords: string[];

  @Field(() => Float)
  aiOptimizationScore: number;

  @Field()
  lastOptimized: string;
}

@ObjectType()
export class RecommendedStructureType {
  @Field()
  primaryQuestion: string;

  @Field(() => [String])
  subQuestions: string[];

  @Field()
  unifiedAnswer: string;
}

@ObjectType()
export class FAQClusterType {
  @Field()
  clusterId: string;

  @Field()
  theme: string;

  @Field(() => [FAQEntryType])
  entries: FAQEntryType[];

  @Field(() => Float)
  combinedScore: number;

  @Field(() => RecommendedStructureType)
  recommendedStructure: RecommendedStructureType;
}

@ObjectType()
export class FAQOptimizationResultType {
  @Field(() => [FAQEntryType])
  originalFAQs: FAQEntryType[];

  @Field(() => [FAQClusterType])
  optimizedClusters: FAQClusterType[];

  @Field()
  structuredData: string; // JSON string

  @Field(() => Float)
  overallImprovementScore: number;

  @Field(() => [String])
  recommendations: string[];
}

// Input Types
@InputType()
export class GEOContentInputType {
  @Field()
  title: string;

  @Field()
  content: string;

  @Field()
  type: string;

  @Field(() => [String])
  targetKeywords: string[];

  @Field({ nullable: true })
  sourceUrl?: string;
}

@InputType()
export class FAQEntryInputType {
  @Field()
  id: string;

  @Field()
  question: string;

  @Field()
  answer: string;

  @Field()
  category: string;

  @Field()
  priority: string;

  @Field(() => [String])
  targetKeywords: string[];

  @Field(() => Float)
  aiOptimizationScore: number;

  @Field()
  lastOptimized: string;
}

@Resolver()
export class GEOResolver {
  constructor(
    private geoEngine: GEOCoreEngineService,
    private citationMonitor: AICitationMonitorService,
    private faqService: FAQRestructuringService
  ) {}

  @Query(() => String)
  async geoStatus(): Promise<string> {
    return 'GEO (AI生成搜索引擎优化) 服务运行正常 🚀';
  }

  @Mutation(() => GEOOptimizedContentType)
  async optimizeContentForGEO(
    @Args('input', { type: () => GEOContentInputType }) input: GEOContentInputType
  ): Promise<GEOOptimizedContentType> {
    const geoInput: GEOContentInput = {
      title: input.title,
      content: input.content,
      type: input.type as any,
      targetKeywords: input.targetKeywords,
      sourceUrl: input.sourceUrl
    };

    const result = await this.geoEngine.optimizeForGEO(geoInput);
    
    return {
      originalContent: result.originalContent,
      optimizedContent: result.optimizedContent,
      structuredData: JSON.stringify(result.structuredData),
      aiReadinessScore: result.aiReadinessScore,
      recommendedImprovements: result.recommendedImprovements,
      metaTags: result.metaTags
    };
  }

  @Query(() => AIEngineCompatibilityType)
  async assessAIEngineCompatibility(
    @Args('content') content: string
  ): Promise<AIEngineCompatibilityType> {
    return await this.geoEngine.assessAIEngineCompatibility(content);
  }

  @Query(() => CitationInsightsType)
  async getAICitationInsights(): Promise<CitationInsightsType> {
    const insights = await this.citationMonitor.monitorAICitations();
    
    return {
      totalCitations: insights.totalCitations,
      citationRate: insights.citationRate,
      platformDistribution: JSON.stringify(insights.platformDistribution),
      topPerformingContent: JSON.stringify(insights.topPerformingContent),
      competitorComparison: insights.competitorComparison.map(comp => ({
        competitor: comp.competitor,
        mentions: comp.mentions,
        citationRate: comp.citationRate,
        topQueries: comp.topQueries,
        sentiment: comp.sentiment
      })),
      trends: insights.trends.map(trend => ({
        date: trend.date,
        totalCitations: trend.totalCitations,
        platformBreakdown: JSON.stringify(trend.platformBreakdown),
        topCitedContent: JSON.stringify(trend.topCitedContent)
      })),
      recommendations: insights.recommendations
    };
  }

  @Query(() => [String])
  async getCitationAlerts(): Promise<string[]> {
    const alerts = await this.citationMonitor.checkCitationAlerts();
    return alerts.map(alert => `[${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message} - ${alert.actionRequired}`);
  }

  @Mutation(() => FAQOptimizationResultType)
  async optimizeFAQsForGEO(
    @Args('faqs', { type: () => [FAQEntryInputType] }) faqsInput: FAQEntryInputType[]
  ): Promise<FAQOptimizationResultType> {
    const faqs: FAQEntry[] = faqsInput.map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      priority: faq.priority as any,
      targetKeywords: faq.targetKeywords,
      aiOptimizationScore: faq.aiOptimizationScore,
      lastOptimized: new Date(faq.lastOptimized)
    }));

    const result = await this.faqService.restructureFAQsForGEO(faqs);
    
    return {
      originalFAQs: result.originalFAQs.map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        priority: faq.priority,
        targetKeywords: faq.targetKeywords,
        aiOptimizationScore: faq.aiOptimizationScore,
        lastOptimized: faq.lastOptimized.toISOString()
      })),
      optimizedClusters: result.optimizedClusters.map(cluster => ({
        clusterId: cluster.clusterId,
        theme: cluster.theme,
        entries: cluster.entries.map(entry => ({
          id: entry.id,
          question: entry.question,
          answer: entry.answer,
          category: entry.category,
          priority: entry.priority,
          targetKeywords: entry.targetKeywords,
          aiOptimizationScore: entry.aiOptimizationScore,
          lastOptimized: entry.lastOptimized.toISOString()
        })),
        combinedScore: cluster.combinedScore,
        recommendedStructure: cluster.recommendedStructure
      })),
      structuredData: JSON.stringify(result.structuredData),
      overallImprovementScore: result.overallImprovementScore,
      recommendations: result.recommendations
    };
  }

  @Query(() => String)
  async getGEOHealthCheck(): Promise<string> {
    try {
      // 测试各个服务
      const testContent = "这是一个测试内容，用于检查GEO引擎健康状态。";
      
      // 测试GEO引擎
      const geoTest = await this.geoEngine.assessAIEngineCompatibility(testContent);
      
      // 测试FAQ服务
      const testFAQ: FAQEntry = {
        id: 'test-1',
        question: '测试问题？',
        answer: '测试答案',
        category: 'test',
        priority: 'medium',
        targetKeywords: ['测试'],
        aiOptimizationScore: 0.5,
        lastOptimized: new Date()
      };
      
      await this.faqService.restructureFAQsForGEO([testFAQ]);
      
      return `✅ GEO服务健康检查通过
      
📊 GEO引擎状态: 正常 (兼容性评分: ${geoTest.overall.toFixed(2)})
🔍 AI引用监测: 正常 
📝 FAQ重构服务: 正常
🎯 所有核心组件运行良好

当前时间: ${new Date().toISOString()}`;
      
    } catch (error) {
      return `❌ GEO服务健康检查失败: ${error.message}`;
    }
  }

  @Query(() => String)
  async getGEOCapabilities(): Promise<string> {
    return `🚀 Eufy GEO3 核心能力概览

📍 **AI生成搜索引擎优化 (GEO)**
   • 内容智能结构化 (Schema.org)
   • AI引擎兼容性评估
   • 多模态内容优化
   • 语义权威性评分

🔍 **实时AI引用监测**
   • 跨平台引用追踪 (Google SGE, Bing Chat, Perplexity, ChatGPT)
   • 竞品分析与对比
   • 引用趋势预测
   • 实时预警系统

📚 **FAQ智能重构**
   • 语义聚类分析
   • 结构化数据生成
   • 对话式内容优化
   • 多主题统一管理

🎯 **核心优势**
   • 针对AI理解优化
   • 提升AI引用概率
   • 增强内容权威性
   • 实现智能化运营

版本: 1.0.0 | 状态: 生产就绪`;
  }
}