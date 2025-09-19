import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GEOCoreEngineService, GEOContentInput } from './geo-core-engine.service';

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  targetKeywords: string[];
  aiOptimizationScore: number;
  lastOptimized: Date;
}

export interface FAQCluster {
  clusterId: string;
  theme: string;
  entries: FAQEntry[];
  combinedScore: number;
  recommendedStructure: {
    primaryQuestion: string;
    subQuestions: string[];
    unifiedAnswer: string;
  };
}

export interface FAQOptimizationResult {
  originalFAQs: FAQEntry[];
  optimizedClusters: FAQCluster[];
  structuredData: any[];
  overallImprovementScore: number;
  recommendations: string[];
}

@Injectable()
export class FAQRestructuringService {
  constructor(
    private configService: ConfigService,
    private geoEngine: GEOCoreEngineService
  ) {}

  /**
   * 核心：FAQ智能重构优化
   */
  async restructureFAQsForGEO(faqs: FAQEntry[]): Promise<FAQOptimizationResult> {
    console.log(`🔄 开始FAQ重构优化，共${faqs.length}条FAQ...`);
    
    // 1. FAQ语义聚类
    const clusters = await this.clusterFAQsBySemantics(faqs);
    
    // 2. 为每个聚类优化结构
    const optimizedClusters = await this.optimizeClusters(clusters);
    
    // 3. 生成结构化数据
    const structuredData = await this.generateFAQStructuredData(optimizedClusters);
    
    // 4. 计算整体改进评分
    const improvementScore = await this.calculateImprovementScore(faqs, optimizedClusters);
    
    // 5. 生成优化建议
    const recommendations = await this.generateOptimizationRecommendations(optimizedClusters);

    return {
      originalFAQs: faqs,
      optimizedClusters,
      structuredData,
      overallImprovementScore: improvementScore,
      recommendations
    };
  }

  /**
   * FAQ语义聚类
   */
  private async clusterFAQsBySemantics(faqs: FAQEntry[]): Promise<FAQCluster[]> {
    console.log('🧠 进行FAQ语义聚类分析...');
    
    // 智能家居产品FAQ主题分类
    const themeCategories = {
      'installation': ['安装', '设置', 'setup', 'install', '配置'],
      'troubleshooting': ['故障', '问题', 'not working', 'error', '无法'],
      'features': ['功能', '特性', 'feature', '支持', '能否'],
      'comparison': ['对比', '比较', 'vs', 'versus', '区别'],
      'compatibility': ['兼容', '支持', 'compatible', '适用'],
      'security': ['安全', '隐私', 'security', 'privacy', '保护'],
      'maintenance': ['维护', '保养', 'maintenance', '清洁', '更新'],
      'purchasing': ['购买', '价格', 'price', '多少钱', 'cost']
    };

    const clusters: FAQCluster[] = [];
    const processedFAQs = new Set<string>();

    // 为每个主题创建聚类
    for (const [themeKey, keywords] of Object.entries(themeCategories)) {
      const clusterFAQs: FAQEntry[] = [];
      
      faqs.forEach(faq => {
        if (processedFAQs.has(faq.id)) return;
        
        const questionText = faq.question.toLowerCase();
        const answerText = faq.answer.toLowerCase();
        
        // 检查是否匹配当前主题
        const isMatch = keywords.some(keyword => 
          questionText.includes(keyword.toLowerCase()) || 
          answerText.includes(keyword.toLowerCase())
        );
        
        if (isMatch) {
          clusterFAQs.push(faq);
          processedFAQs.add(faq.id);
        }
      });

      if (clusterFAQs.length > 0) {
        clusters.push({
          clusterId: `cluster_${themeKey}`,
          theme: this.getThemeName(themeKey),
          entries: clusterFAQs,
          combinedScore: 0, // 后续计算
          recommendedStructure: {
            primaryQuestion: '',
            subQuestions: [],
            unifiedAnswer: ''
          }
        });
      }
    }

    // 处理未分类的FAQ
    const unclassifiedFAQs = faqs.filter(faq => !processedFAQs.has(faq.id));
    if (unclassifiedFAQs.length > 0) {
      clusters.push({
        clusterId: 'cluster_general',
        theme: '通用问题',
        entries: unclassifiedFAQs,
        combinedScore: 0,
        recommendedStructure: {
          primaryQuestion: '',
          subQuestions: [],
          unifiedAnswer: ''
        }
      });
    }

    console.log(`📊 完成聚类分析，共生成${clusters.length}个主题聚类`);
    return clusters;
  }

  /**
   * 优化聚类结构
   */
  private async optimizeClusters(clusters: FAQCluster[]): Promise<FAQCluster[]> {
    const optimizedClusters: FAQCluster[] = [];

    for (const cluster of clusters) {
      console.log(`🎯 优化聚类: ${cluster.theme}（${cluster.entries.length}条FAQ）`);
      
      // 1. 识别主要问题
      const primaryQuestion = await this.identifyPrimaryQuestion(cluster.entries);
      
      // 2. 生成子问题列表
      const subQuestions = await this.generateSubQuestions(cluster.entries);
      
      // 3. 创建统一答案
      const unifiedAnswer = await this.createUnifiedAnswer(cluster.entries, primaryQuestion);
      
      // 4. 使用GEO引擎优化内容
      const geoInput: GEOContentInput = {
        title: primaryQuestion,
        content: unifiedAnswer,
        type: 'faq',
        targetKeywords: this.extractKeywordsFromCluster(cluster.entries)
      };
      
      const geoOptimized = await this.geoEngine.optimizeForGEO(geoInput);
      
      // 5. 计算聚类评分
      const combinedScore = await this.calculateClusterScore(cluster.entries, geoOptimized);

      optimizedClusters.push({
        ...cluster,
        combinedScore,
        recommendedStructure: {
          primaryQuestion,
          subQuestions,
          unifiedAnswer: geoOptimized.optimizedContent
        }
      });
    }

    return optimizedClusters.sort((a, b) => b.combinedScore - a.combinedScore);
  }

  /**
   * 生成FAQ结构化数据
   */
  private async generateFAQStructuredData(clusters: FAQCluster[]): Promise<any[]> {
    const structuredData: any[] = [];

    for (const cluster of clusters) {
      // 主FAQ页面Schema
      const faqPageSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'name': `${cluster.theme} - Eufy智能家居FAQ`,
        'description': `关于Eufy智能家居${cluster.theme}的常见问题解答`,
        'author': {
          '@type': 'Organization',
          'name': 'Eufy',
          'url': 'https://www.eufy.com'
        },
        'dateModified': new Date().toISOString(),
        'mainEntity': []
      };

      // 添加主要问题
      faqPageSchema.mainEntity.push({
        '@type': 'Question',
        'name': cluster.recommendedStructure.primaryQuestion,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': cluster.recommendedStructure.unifiedAnswer,
          'author': {
            '@type': 'Organization',
            'name': 'Eufy'
          }
        }
      });

      // 添加子问题
      cluster.recommendedStructure.subQuestions.forEach(subQ => {
        const relatedEntry = cluster.entries.find(entry => 
          entry.question.toLowerCase().includes(subQ.toLowerCase().substring(0, 10))
        );
        
        if (relatedEntry) {
          faqPageSchema.mainEntity.push({
            '@type': 'Question',
            'name': subQ,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': relatedEntry.answer,
              'author': {
                '@type': 'Organization',
                'name': 'Eufy'
              }
            }
          });
        }
      });

      structuredData.push(faqPageSchema);
    }

    return structuredData;
  }

  /**
   * 计算整体改进评分
   */
  private async calculateImprovementScore(
    originalFAQs: FAQEntry[],
    optimizedClusters: FAQCluster[]
  ): Promise<number> {
    const originalAvgScore = originalFAQs.reduce((sum, faq) => sum + faq.aiOptimizationScore, 0) / originalFAQs.length;
    const optimizedAvgScore = optimizedClusters.reduce((sum, cluster) => sum + cluster.combinedScore, 0) / optimizedClusters.length;
    
    // 结构化改进奖励
    const structuralBonus = optimizedClusters.length > 1 ? 0.1 : 0;
    
    // 聚类效果奖励
    const clusteringBonus = optimizedClusters.reduce((bonus, cluster) => {
      return bonus + (cluster.entries.length > 2 ? 0.05 : 0);
    }, 0);

    const improvementRatio = originalAvgScore > 0 ? (optimizedAvgScore - originalAvgScore) / originalAvgScore : 0.5;
    const finalScore = Math.min(0.9 + structuralBonus + clusteringBonus + improvementRatio, 1.0);
    
    return Math.round(finalScore * 100) / 100;
  }

  /**
   * 生成优化建议
   */
  private async generateOptimizationRecommendations(clusters: FAQCluster[]): Promise<string[]> {
    const recommendations: string[] = [];

    // 基于聚类分析的建议
    if (clusters.length > 5) {
      recommendations.push('🎯 FAQ主题过于分散，建议合并相似主题以提高用户体验');
    }

    if (clusters.length < 3) {
      recommendations.push('📈 FAQ覆盖面不足，建议增加更多主题分类');
    }

    // 基于评分的建议
    const lowScoreClusters = clusters.filter(c => c.combinedScore < 0.6);
    if (lowScoreClusters.length > 0) {
      recommendations.push(`🔧 ${lowScoreClusters.length}个主题评分较低，需要重点优化内容质量`);
    }

    // 基于内容长度的建议
    const shortAnswerClusters = clusters.filter(c => 
      c.recommendedStructure.unifiedAnswer.length < 200
    );
    if (shortAnswerClusters.length > 0) {
      recommendations.push('📝 部分答案内容过短，建议增加详细说明和示例');
    }

    // 基于关键词覆盖的建议
    const keywordCoverage = await this.analyzeKeywordCoverage(clusters);
    if (keywordCoverage < 0.7) {
      recommendations.push('🔍 关键词覆盖不足，建议针对核心搜索词增加FAQ内容');
    }

    // AI引擎优化建议
    recommendations.push('🤖 建议为每个FAQ添加对话式开场，提升AI引擎友好度');
    recommendations.push('📊 添加具体数据和统计信息，增强内容权威性');
    recommendations.push('🔗 在FAQ之间建立交叉引用，构建知识网络');

    return recommendations;
  }

  // 辅助方法
  private getThemeName(themeKey: string): string {
    const themeNames = {
      'installation': '安装设置',
      'troubleshooting': '故障排除',
      'features': '功能特性',
      'comparison': '产品对比',
      'compatibility': '兼容适配',
      'security': '安全隐私',
      'maintenance': '维护保养',
      'purchasing': '购买咨询'
    };
    return themeNames[themeKey] || themeKey;
  }

  private async identifyPrimaryQuestion(entries: FAQEntry[]): Promise<string> {
    // 找到最高优先级和最高评分的问题
    const sortedEntries = entries.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      return (priorityScore[b.priority] * b.aiOptimizationScore) - 
             (priorityScore[a.priority] * a.aiOptimizationScore);
    });

    if (sortedEntries.length > 0) {
      return sortedEntries[0].question;
    }

    return '智能家居设备相关问题';
  }

  private async generateSubQuestions(entries: FAQEntry[]): Promise<string[]> {
    return entries
      .slice(1, 6) // 取前5个作为子问题
      .map(entry => entry.question);
  }

  private async createUnifiedAnswer(entries: FAQEntry[], primaryQuestion: string): Promise<string> {
    if (entries.length === 1) {
      return entries[0].answer;
    }

    // 合并多个答案，创建统一的综合回答
    const introduction = `关于${primaryQuestion.replace('?', '')}，这里为您提供详细解答：\n\n`;
    
    const combinedContent = entries.map((entry, index) => {
      return `**${index + 1}. ${entry.question}**\n${entry.answer}\n`;
    }).join('\n');

    const conclusion = '\n\n如果您还有其他问题，建议查看产品说明书或联系Eufy客服获得进一步帮助。';

    return introduction + combinedContent + conclusion;
  }

  private extractKeywordsFromCluster(entries: FAQEntry[]): string[] {
    const allKeywords = new Set<string>();
    
    entries.forEach(entry => {
      entry.targetKeywords.forEach(keyword => allKeywords.add(keyword));
    });

    return Array.from(allKeywords).slice(0, 10); // 限制关键词数量
  }

  private async calculateClusterScore(entries: FAQEntry[], geoOptimized: any): Promise<number> {
    const avgOriginalScore = entries.reduce((sum, entry) => sum + entry.aiOptimizationScore, 0) / entries.length;
    const geoScore = geoOptimized.aiReadinessScore;
    const entryCount = entries.length;
    
    // 基础分：原始平均分和GEO优化分的加权平均
    const baseScore = (avgOriginalScore * 0.4) + (geoScore * 0.6);
    
    // 数量奖励：FAQ数量越多，聚类效果越好
    const quantityBonus = Math.min(entryCount * 0.02, 0.1);
    
    return Math.min(baseScore + quantityBonus, 1.0);
  }

  private async analyzeKeywordCoverage(clusters: FAQCluster[]): Promise<number> {
    // 模拟关键词覆盖分析
    const totalKeywords = clusters.reduce((total, cluster) => {
      return total + this.extractKeywordsFromCluster(cluster.entries).length;
    }, 0);

    const expectedKeywords = 50; // 预期应该覆盖的关键词数量
    return Math.min(totalKeywords / expectedKeywords, 1.0);
  }

  /**
   * 批量处理FAQ优化
   */
  async batchOptimizeFAQs(faqCategories: Record<string, FAQEntry[]>): Promise<Record<string, FAQOptimizationResult>> {
    const results: Record<string, FAQOptimizationResult> = {};
    
    console.log(`🔄 开始批量FAQ优化，共${Object.keys(faqCategories).length}个分类...`);
    
    for (const [category, faqs] of Object.entries(faqCategories)) {
      console.log(`📝 正在优化分类: ${category}`);
      results[category] = await this.restructureFAQsForGEO(faqs);
    }
    
    return results;
  }

  /**
   * 生成FAQ性能报告
   */
  async generateFAQPerformanceReport(results: FAQOptimizationResult[]): Promise<{
    totalFAQs: number;
    averageImprovementScore: number;
    topRecommendations: string[];
    structuredDataCount: number;
    bestPerformingThemes: string[];
  }> {
    const totalFAQs = results.reduce((sum, result) => sum + result.originalFAQs.length, 0);
    const averageImprovementScore = results.reduce((sum, result) => sum + result.overallImprovementScore, 0) / results.length;
    
    // 收集所有建议并按频率排序
    const allRecommendations = results.flatMap(result => result.recommendations);
    const recommendationCounts = allRecommendations.reduce((counts, rec) => {
      counts[rec] = (counts[rec] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const topRecommendations = Object.entries(recommendationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([rec]) => rec);
    
    const structuredDataCount = results.reduce((sum, result) => sum + result.structuredData.length, 0);
    
    // 识别表现最佳的主题
    const allClusters = results.flatMap(result => result.optimizedClusters);
    const bestPerformingThemes = allClusters
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, 3)
      .map(cluster => cluster.theme);

    return {
      totalFAQs,
      averageImprovementScore: Math.round(averageImprovementScore * 100) / 100,
      topRecommendations,
      structuredDataCount,
      bestPerformingThemes
    };
  }
}