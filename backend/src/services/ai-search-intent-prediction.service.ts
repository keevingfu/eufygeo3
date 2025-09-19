import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SearchQuery {
  query: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  device: 'mobile' | 'desktop' | 'tablet';
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
  context?: {
    previousQueries: string[];
    pageHistory: string[];
    searchSource: 'google' | 'bing' | 'ai-assistant' | 'voice' | 'direct';
  };
}

export interface IntentPrediction {
  intentType: 'informational' | 'navigational' | 'transactional' | 'commercial' | 'local' | 'troubleshooting';
  confidence: number;
  subIntents: string[];
  predictedActions: PredictedAction[];
  contentRecommendations: ContentRecommendation[];
  nextQueryPredictions: NextQueryPrediction[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  userJourneyStage: 'awareness' | 'consideration' | 'decision' | 'purchase' | 'support';
}

export interface PredictedAction {
  actionType: 'content_consumption' | 'product_research' | 'purchase_intent' | 'support_seeking' | 'comparison';
  probability: number;
  timeframe: 'immediate' | 'within_hour' | 'within_day' | 'within_week';
  triggerFactors: string[];
}

export interface ContentRecommendation {
  contentType: 'article' | 'video' | 'product_page' | 'faq' | 'tutorial' | 'comparison' | 'review';
  title: string;
  relevanceScore: number;
  personalizationFactors: string[];
  optimizationSuggestions: string[];
}

export interface NextQueryPrediction {
  predictedQuery: string;
  probability: number;
  timeEstimate: string;
  triggerEvents: string[];
  contentGaps: string[];
}

export interface UserJourneyAnalysis {
  currentStage: string;
  stageConfidence: number;
  journeyProgress: number; // 0-1
  expectedNextStages: string[];
  dropoffRisks: string[];
  accelerationOpportunities: string[];
}

export interface IntentEvolutionPattern {
  patternId: string;
  patternName: string;
  querySequence: string[];
  averageTimespan: number;
  conversionRate: number;
  dropoffPoints: number[];
  optimizationTips: string[];
}

@Injectable()
export class AISearchIntentPredictionService {
  private readonly intentPatterns = new Map<string, IntentEvolutionPattern>();
  private readonly userSessions = new Map<string, SearchQuery[]>();
  
  constructor(private configService: ConfigService) {
    this.initializeIntentPatterns();
  }

  /**
   * 核心：AI搜索意图预测
   */
  async predictSearchIntent(query: SearchQuery): Promise<IntentPrediction> {
    console.log(`🧠 预测搜索意图: "${query.query}"`);
    
    // 1. 基础意图分类
    const baseIntent = await this.classifyBaseIntent(query);
    
    // 2. 上下文增强分析
    const contextEnhanced = await this.enhanceWithContext(baseIntent, query);
    
    // 3. 用户旅程阶段识别
    const journeyStage = await this.identifyJourneyStage(query);
    
    // 4. 预测用户行为
    const predictedActions = await this.predictUserActions(query, contextEnhanced);
    
    // 5. 生成内容推荐
    const contentRecommendations = await this.generateContentRecommendations(query, contextEnhanced);
    
    // 6. 预测下一步查询
    const nextQueries = await this.predictNextQueries(query, journeyStage);
    
    // 7. 评估紧急程度
    const urgencyLevel = await this.assessUrgency(query, contextEnhanced);

    return {
      intentType: contextEnhanced.intentType,
      confidence: contextEnhanced.confidence,
      subIntents: contextEnhanced.subIntents,
      predictedActions,
      contentRecommendations,
      nextQueryPredictions: nextQueries,
      urgencyLevel,
      userJourneyStage: journeyStage
    };
  }

  /**
   * 基础意图分类
   */
  private async classifyBaseIntent(query: SearchQuery): Promise<{
    intentType: IntentPrediction['intentType'];
    confidence: number;
    subIntents: string[];
  }> {
    const queryText = query.query.toLowerCase();
    
    // 智能家居安防产品意图模式
    const intentPatterns = {
      informational: {
        keywords: ['什么是', 'how to', '如何', '为什么', 'what is', 'how does', '原理', '介绍'],
        patterns: [/如何.*/, /什么.*/, /怎么.*/, /.*工作原理/, /.*是什么/],
        confidence: 0.8
      },
      transactional: {
        keywords: ['购买', 'buy', '价格', 'price', '折扣', 'discount', '优惠', '下单'],
        patterns: [/.*多少钱/, /.*价格/, /.*购买/, /.*便宜/, /.*优惠/],
        confidence: 0.9
      },
      commercial: {
        keywords: ['最好的', 'best', '推荐', 'recommend', '对比', 'vs', '评测', 'review'],
        patterns: [/.*最好.*/, /.*推荐.*/, /.*vs.*/, /.*对比.*/, /.*评测.*/],
        confidence: 0.85
      },
      troubleshooting: {
        keywords: ['问题', 'problem', '故障', 'error', '不能', '无法', '不工作', 'not working'],
        patterns: [/.*不能.*/, /.*无法.*/, /.*问题/, /.*故障/, /.*不工作/],
        confidence: 0.9
      },
      local: {
        keywords: ['附近', 'near', '本地', 'local', '店铺', 'store', '服务', 'service'],
        patterns: [/.*附近.*/, /.*本地.*/, /.*店铺.*/, /.*服务.*/],
        confidence: 0.75
      }
    };

    let bestMatch = { intentType: 'informational' as const, confidence: 0.3, subIntents: [] as string[] };

    for (const [intent, config] of Object.entries(intentPatterns)) {
      let score = 0;
      const matchedSubIntents: string[] = [];

      // 关键词匹配
      for (const keyword of config.keywords) {
        if (queryText.includes(keyword)) {
          score += 0.3;
          matchedSubIntents.push(`keyword_${keyword}`);
        }
      }

      // 模式匹配
      for (const pattern of config.patterns) {
        if (pattern.test(queryText)) {
          score += 0.4;
          matchedSubIntents.push(`pattern_match`);
        }
      }

      // 特定产品意图检测
      if (queryText.includes('eufy') || queryText.includes('安防') || queryText.includes('摄像头')) {
        if (intent === 'commercial' || intent === 'transactional') {
          score += 0.2;
          matchedSubIntents.push('product_specific');
        }
      }

      const finalScore = Math.min(score * config.confidence, 1.0);
      
      if (finalScore > bestMatch.confidence) {
        bestMatch = {
          intentType: intent as IntentPrediction['intentType'],
          confidence: finalScore,
          subIntents: matchedSubIntents
        };
      }
    }

    return bestMatch;
  }

  /**
   * 上下文增强分析
   */
  private async enhanceWithContext(baseIntent: any, query: SearchQuery): Promise<any> {
    const enhanced = { ...baseIntent };

    // 设备上下文增强
    if (query.device === 'mobile') {
      if (baseIntent.intentType === 'local') {
        enhanced.confidence += 0.1;
        enhanced.subIntents.push('mobile_local_intent');
      }
    }

    // 时间上下文增强
    const hour = query.timestamp.getHours();
    if (hour >= 22 || hour <= 6) { // 夜间
      if (query.query.includes('安全') || query.query.includes('security')) {
        enhanced.confidence += 0.1;
        enhanced.subIntents.push('night_security_concern');
      }
    }

    // 历史查询上下文
    if (query.context?.previousQueries?.length > 0) {
      const hasProductResearch = query.context.previousQueries.some(q => 
        q.includes('评测') || q.includes('review') || q.includes('对比')
      );
      
      if (hasProductResearch && baseIntent.intentType === 'transactional') {
        enhanced.confidence += 0.2;
        enhanced.subIntents.push('research_to_purchase');
      }
    }

    // 搜索来源增强
    if (query.context?.searchSource === 'ai-assistant') {
      enhanced.subIntents.push('ai_assisted_search');
      if (baseIntent.intentType === 'informational') {
        enhanced.confidence += 0.1;
      }
    }

    return enhanced;
  }

  /**
   * 识别用户旅程阶段
   */
  private async identifyJourneyStage(query: SearchQuery): Promise<IntentPrediction['userJourneyStage']> {
    const queryText = query.query.toLowerCase();
    
    // 阶段识别规则
    const stageIndicators = {
      awareness: ['什么是', 'what is', '了解', '介绍', '原理'],
      consideration: ['对比', 'vs', '评测', 'review', '推荐', 'best', '选择'],
      decision: ['购买', 'buy', '价格', 'price', '哪里买', 'where to buy'],
      purchase: ['下单', 'order', '付款', 'payment', '优惠码', 'coupon'],
      support: ['问题', 'problem', '故障', 'issue', '安装', 'setup', '使用']
    };

    for (const [stage, indicators] of Object.entries(stageIndicators)) {
      for (const indicator of indicators) {
        if (queryText.includes(indicator)) {
          return stage as IntentPrediction['userJourneyStage'];
        }
      }
    }

    // 基于历史查询推断阶段
    if (query.context?.previousQueries?.length > 0) {
      const prevQueries = query.context.previousQueries.join(' ').toLowerCase();
      
      if (prevQueries.includes('对比') && queryText.includes('价格')) {
        return 'decision';
      }
      
      if (prevQueries.includes('购买') && queryText.includes('安装')) {
        return 'support';
      }
    }

    return 'awareness'; // 默认阶段
  }

  /**
   * 预测用户行为
   */
  private async predictUserActions(query: SearchQuery, intent: any): Promise<PredictedAction[]> {
    const actions: PredictedAction[] = [];

    switch (intent.intentType) {
      case 'informational':
        actions.push({
          actionType: 'content_consumption',
          probability: 0.8,
          timeframe: 'immediate',
          triggerFactors: ['curiosity', 'learning_intent']
        });
        break;

      case 'commercial':
        actions.push({
          actionType: 'product_research',
          probability: 0.9,
          timeframe: 'within_hour',
          triggerFactors: ['comparison_intent', 'evaluation_phase']
        });
        actions.push({
          actionType: 'purchase_intent',
          probability: 0.6,
          timeframe: 'within_day',
          triggerFactors: ['positive_reviews', 'price_satisfaction']
        });
        break;

      case 'transactional':
        actions.push({
          actionType: 'purchase_intent',
          probability: 0.95,
          timeframe: 'immediate',
          triggerFactors: ['clear_buying_intent', 'price_inquiry']
        });
        break;

      case 'troubleshooting':
        actions.push({
          actionType: 'support_seeking',
          probability: 0.9,
          timeframe: 'immediate',
          triggerFactors: ['problem_urgency', 'solution_needed']
        });
        break;
    }

    // 设备特定行为预测
    if (query.device === 'mobile') {
      actions.forEach(action => {
        if (action.actionType === 'purchase_intent') {
          action.triggerFactors.push('mobile_convenience');
        }
      });
    }

    return actions;
  }

  /**
   * 生成内容推荐
   */
  private async generateContentRecommendations(query: SearchQuery, intent: any): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    switch (intent.intentType) {
      case 'informational':
        recommendations.push({
          contentType: 'article',
          title: `Eufy智能安防系统完整指南 - ${this.extractProductFromQuery(query.query)}`,
          relevanceScore: 0.9,
          personalizationFactors: ['user_intent_informational', 'product_interest'],
          optimizationSuggestions: ['添加详细图表', '增加视频演示', '提供下载资源']
        });
        break;

      case 'commercial':
        recommendations.push({
          contentType: 'comparison',
          title: `2024年最佳智能安防摄像头对比评测 - Eufy vs 竞品`,
          relevanceScore: 0.95,
          personalizationFactors: ['comparison_intent', 'evaluation_stage'],
          optimizationSuggestions: ['突出Eufy优势', '添加价格对比表', '包含用户评价']
        });
        break;

      case 'transactional':
        recommendations.push({
          contentType: 'product_page',
          title: `Eufy ${this.extractProductFromQuery(query.query)} - 官方购买页面`,
          relevanceScore: 0.98,
          personalizationFactors: ['purchase_intent', 'price_sensitivity'],
          optimizationSuggestions: ['突出促销信息', '添加购买保障', '显示库存状态']
        });
        break;

      case 'troubleshooting':
        recommendations.push({
          contentType: 'faq',
          title: `${this.extractProblemFromQuery(query.query)} - 常见问题解决方案`,
          relevanceScore: 0.92,
          personalizationFactors: ['problem_solving', 'urgency_high'],
          optimizationSuggestions: ['提供步骤图解', '添加视频教程', '联系客服选项']
        });
        break;
    }

    // 个性化调整
    if (query.device === 'mobile') {
      recommendations.forEach(rec => {
        rec.optimizationSuggestions.push('移动端界面优化');
        rec.personalizationFactors.push('mobile_user');
      });
    }

    return recommendations;
  }

  /**
   * 预测下一步查询
   */
  private async predictNextQueries(query: SearchQuery, journeyStage: string): Promise<NextQueryPrediction[]> {
    const predictions: NextQueryPrediction[] = [];

    const queryText = query.query.toLowerCase();
    const product = this.extractProductFromQuery(queryText);

    switch (journeyStage) {
      case 'awareness':
        predictions.push({
          predictedQuery: `${product} 怎么样`,
          probability: 0.7,
          timeEstimate: '5-10分钟',
          triggerEvents: ['content_consumption_complete'],
          contentGaps: ['详细评测', '用户体验']
        });
        break;

      case 'consideration':
        predictions.push({
          predictedQuery: `${product} 价格`,
          probability: 0.8,
          timeEstimate: '10-30分钟',
          triggerEvents: ['comparison_complete', 'positive_impression'],
          contentGaps: ['价格信息', '优惠活动']
        });
        break;

      case 'decision':
        predictions.push({
          predictedQuery: `${product} 哪里买`,
          probability: 0.9,
          timeEstimate: '即时-1小时',
          triggerEvents: ['price_acceptance', 'purchase_decision'],
          contentGaps: ['购买渠道', '售后保障']
        });
        break;

      case 'purchase':
        predictions.push({
          predictedQuery: `${product} 安装教程`,
          probability: 0.85,
          timeEstimate: '1-3天',
          triggerEvents: ['product_delivery', 'setup_needed'],
          contentGaps: ['安装指南', '初始设置']
        });
        break;
    }

    return predictions;
  }

  /**
   * 评估查询紧急程度
   */
  private async assessUrgency(query: SearchQuery, intent: any): Promise<IntentPrediction['urgencyLevel']> {
    const queryText = query.query.toLowerCase();
    
    // 高紧急度指标
    const urgentKeywords = ['紧急', 'urgent', '马上', '立即', '现在', '不能用', '坏了', '故障'];
    const highUrgencyKeywords = ['问题', 'problem', '不工作', 'not working', '帮助', 'help'];
    
    if (urgentKeywords.some(keyword => queryText.includes(keyword))) {
      return 'urgent';
    }
    
    if (highUrgencyKeywords.some(keyword => queryText.includes(keyword))) {
      return 'high';
    }
    
    // 基于意图类型评估
    if (intent.intentType === 'troubleshooting') {
      return 'high';
    }
    
    if (intent.intentType === 'transactional' && intent.confidence > 0.8) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * 分析用户旅程模式
   */
  async analyzeUserJourney(sessionId: string): Promise<UserJourneyAnalysis> {
    const sessionQueries = this.userSessions.get(sessionId) || [];
    
    if (sessionQueries.length === 0) {
      return {
        currentStage: 'awareness',
        stageConfidence: 0.5,
        journeyProgress: 0.1,
        expectedNextStages: ['consideration'],
        dropoffRisks: ['information_overload'],
        accelerationOpportunities: ['clear_cta', 'personalized_recommendations']
      };
    }

    // 分析查询序列
    const stages = sessionQueries.map(q => this.identifyJourneyStage(q));
    const currentStage = stages[stages.length - 1];
    
    // 计算进度
    const stageOrder = ['awareness', 'consideration', 'decision', 'purchase', 'support'];
    const currentIndex = stageOrder.indexOf(await currentStage);
    const journeyProgress = (currentIndex + 1) / stageOrder.length;

    // 预测下一阶段
    const expectedNextStages = currentIndex < stageOrder.length - 1 
      ? [stageOrder[currentIndex + 1]]
      : ['support'];

    // 识别风险和机会
    const dropoffRisks = this.identifyDropoffRisks(sessionQueries);
    const accelerationOpportunities = this.identifyAccelerationOpportunities(sessionQueries);

    return {
      currentStage: await currentStage,
      stageConfidence: 0.8,
      journeyProgress,
      expectedNextStages,
      dropoffRisks,
      accelerationOpportunities
    };
  }

  /**
   * 学习和优化意图预测模型
   */
  async learnFromUserBehavior(
    query: SearchQuery,
    prediction: IntentPrediction,
    actualBehavior: {
      actionTaken: string;
      timeToAction: number;
      conversionAchieved: boolean;
      feedbackScore?: number;
    }
  ): Promise<void> {
    // 存储学习数据用于模型优化
    const learningData = {
      query: query.query,
      predictedIntent: prediction.intentType,
      predictedConfidence: prediction.confidence,
      actualAction: actualBehavior.actionTaken,
      predictionAccuracy: this.calculatePredictionAccuracy(prediction, actualBehavior),
      timestamp: new Date()
    };

    console.log(`📚 学习数据记录: ${query.query} - 准确度: ${learningData.predictionAccuracy.toFixed(2)}`);
    
    // TODO: 实际实现中应该存储到数据库并训练模型
  }

  // 辅助方法
  private extractProductFromQuery(query: string): string {
    const productKeywords = ['摄像头', 'camera', '门铃', 'doorbell', '传感器', 'sensor'];
    for (const keyword of productKeywords) {
      if (query.includes(keyword)) {
        return keyword;
      }
    }
    return 'Eufy产品';
  }

  private extractProblemFromQuery(query: string): string {
    const problemKeywords = ['连接', '安装', '设置', '录像', '推送'];
    for (const keyword of problemKeywords) {
      if (query.includes(keyword)) {
        return `${keyword}问题`;
      }
    }
    return '设备问题';
  }

  private identifyDropoffRisks(queries: SearchQuery[]): string[] {
    const risks = [];
    
    if (queries.length > 5) {
      risks.push('information_overload');
    }
    
    const hasRepeatedQueries = queries.some((q, i) => 
      queries.slice(i + 1).some(laterQ => laterQ.query === q.query)
    );
    
    if (hasRepeatedQueries) {
      risks.push('unresolved_questions');
    }
    
    return risks;
  }

  private identifyAccelerationOpportunities(queries: SearchQuery[]): string[] {
    const opportunities = [];
    
    const hasComparisonQueries = queries.some(q => 
      q.query.includes('对比') || q.query.includes('vs')
    );
    
    if (hasComparisonQueries) {
      opportunities.push('provide_detailed_comparison');
    }
    
    const hasPriceQueries = queries.some(q => 
      q.query.includes('价格') || q.query.includes('price')
    );
    
    if (hasPriceQueries) {
      opportunities.push('show_pricing_benefits');
    }
    
    return opportunities;
  }

  private calculatePredictionAccuracy(prediction: IntentPrediction, actual: any): number {
    // 简化的准确度计算
    let accuracy = 0;
    
    if (prediction.intentType === this.mapActionToIntent(actual.actionTaken)) {
      accuracy += 0.5;
    }
    
    if (actual.conversionAchieved) {
      accuracy += 0.3;
    }
    
    if (actual.feedbackScore && actual.feedbackScore > 3) {
      accuracy += 0.2;
    }
    
    return Math.min(accuracy, 1.0);
  }

  private mapActionToIntent(action: string): IntentPrediction['intentType'] {
    const mapping = {
      'read_article': 'informational',
      'compare_products': 'commercial',
      'visit_product_page': 'transactional',
      'contact_support': 'troubleshooting',
      'find_store': 'local'
    };
    
    return mapping[action] || 'informational';
  }

  private initializeIntentPatterns(): void {
    // 初始化常见的用户意图演化模式
    const patterns: IntentEvolutionPattern[] = [
      {
        patternId: 'research_to_purchase',
        patternName: '研究到购买',
        querySequence: ['产品介绍', '产品对比', '产品评测', '产品价格', '购买渠道'],
        averageTimespan: 2 * 24 * 60 * 60 * 1000, // 2天
        conversionRate: 0.35,
        dropoffPoints: [2, 4],
        optimizationTips: ['在对比阶段突出优势', '在价格阶段提供优惠']
      },
      {
        patternId: 'problem_to_solution',
        patternName: '问题到解决',
        querySequence: ['设备问题', '故障排除', '解决方案', '联系客服'],
        averageTimespan: 30 * 60 * 1000, // 30分钟
        conversionRate: 0.8,
        dropoffPoints: [2],
        optimizationTips: ['提供清晰的步骤指南', '主动提供客服联系方式']
      }
    ];

    patterns.forEach(pattern => {
      this.intentPatterns.set(pattern.patternId, pattern);
    });
  }

  /**
   * 获取意图预测统计
   */
  async getIntentPredictionStats(): Promise<{
    totalPredictions: number;
    accuracyRate: number;
    topIntentTypes: Array<{ intent: string; count: number; accuracy: number }>;
    userJourneyInsights: any;
  }> {
    // 模拟统计数据
    return {
      totalPredictions: 1250,
      accuracyRate: 0.87,
      topIntentTypes: [
        { intent: 'commercial', count: 450, accuracy: 0.89 },
        { intent: 'informational', count: 380, accuracy: 0.85 },
        { intent: 'troubleshooting', count: 220, accuracy: 0.92 },
        { intent: 'transactional', count: 200, accuracy: 0.84 }
      ],
      userJourneyInsights: {
        averageQueriesPerSession: 3.2,
        conversionRate: 0.23,
        averageTimeToConversion: '2.3天',
        topDropoffStages: ['consideration', 'decision']
      }
    };
  }
}