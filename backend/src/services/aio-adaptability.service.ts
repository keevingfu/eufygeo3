export interface AIOAdaptabilityFactors {
  questionTypeMatch: number;    // 问题类型匹配度 (0-30)
  searchIntentClarity: number;   // 搜索意图清晰度 (0-25)
  contentStructure: number;      // 内容结构适配性 (0-25)
  competitiveEnvironment: number; // 竞争环境 (0-20)
}

export interface AIOAnalysisResult {
  score: number;                 // 总分 (0-100)
  factors: AIOAdaptabilityFactors;
  recommendations: string[];
  predictedPerformance: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class AIOAdaptabilityService {
  /**
   * 计算AIO（AI Overview）适配性得分
   */
  static calculateAIOScore(keyword: string, competitorData?: any): AIOAnalysisResult {
    const factors: AIOAdaptabilityFactors = {
      questionTypeMatch: this.evaluateQuestionType(keyword),
      searchIntentClarity: this.evaluateSearchIntent(keyword),
      contentStructure: this.evaluateContentStructure(keyword),
      competitiveEnvironment: this.evaluateCompetition(keyword, competitorData)
    };

    const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
    
    const recommendations = this.generateRecommendations(factors, keyword);
    const predictedPerformance = this.predictPerformance(totalScore);

    return {
      score: Math.round(totalScore),
      factors,
      recommendations,
      predictedPerformance
    };
  }

  /**
   * 评估问题类型匹配度 (30分)
   */
  private static evaluateQuestionType(keyword: string): number {
    const lowerKeyword = keyword.toLowerCase();
    let score = 0;

    // How-to类问题 (最适合AIO)
    if (lowerKeyword.includes('how to') || lowerKeyword.includes('how do')) {
      score = 30;
    }
    // 比较类问题
    else if (lowerKeyword.includes('vs') || lowerKeyword.includes('versus') || 
             lowerKeyword.includes('compare') || lowerKeyword.includes('difference')) {
      score = 25;
    }
    // What/Why/When类问题
    else if (lowerKeyword.startsWith('what') || lowerKeyword.startsWith('why') || 
             lowerKeyword.startsWith('when') || lowerKeyword.startsWith('where')) {
      score = 20;
    }
    // 定义类问题
    else if (lowerKeyword.includes('definition') || lowerKeyword.includes('meaning') ||
             lowerKeyword.includes('is')) {
      score = 15;
    }
    // 其他类型
    else {
      score = 5;
    }

    return score;
  }

  /**
   * 评估搜索意图清晰度 (25分)
   */
  private static evaluateSearchIntent(keyword: string): number {
    const lowerKeyword = keyword.toLowerCase();
    let score = 0;

    // 信息型意图（最适合AIO）
    const informationalKeywords = [
      'guide', 'tutorial', 'tips', 'advice', 'learn', 'understand',
      'explain', 'overview', 'introduction', 'basics', 'fundamentals'
    ];
    
    const hasInformationalIntent = informationalKeywords.some(word => 
      lowerKeyword.includes(word)
    );

    if (hasInformationalIntent) {
      score = 25;
    }
    // 导航型意图
    else if (lowerKeyword.includes('official') || lowerKeyword.includes('website')) {
      score = 5;
    }
    // 交易型意图
    else if (lowerKeyword.includes('buy') || lowerKeyword.includes('price') || 
             lowerKeyword.includes('deal') || lowerKeyword.includes('discount')) {
      score = 10;
    }
    // 混合意图
    else {
      score = 15;
    }

    return score;
  }

  /**
   * 评估内容结构适配性 (25分)
   */
  private static evaluateContentStructure(keyword: string): number {
    const lowerKeyword = keyword.toLowerCase();
    let score = 15; // 基础分

    // 步骤式内容
    if (lowerKeyword.includes('step') || lowerKeyword.includes('process') || 
        lowerKeyword.includes('guide')) {
      score = 25;
    }
    // 列表式内容
    else if (lowerKeyword.includes('list') || lowerKeyword.includes('top') || 
             lowerKeyword.includes('best') || /\d+/.test(keyword)) {
      score = 20;
    }
    // 问答式内容
    else if (lowerKeyword.includes('faq') || lowerKeyword.includes('q&a')) {
      score = 22;
    }

    return score;
  }

  /**
   * 评估竞争环境 (20分)
   */
  private static evaluateCompetition(_keyword: string, competitorData?: any): number {
    // 如果没有竞争数据，返回中等分数
    if (!competitorData) {
      return 10;
    }

    let score = 0;

    // 已有AIO结果（竞争激烈）
    if (competitorData.hasAIO) {
      score = 0;
    }
    // 竞争对手未覆盖
    else if (!competitorData.topCompetitorsCoverage) {
      score = 20;
    }
    // 内容质量有机会
    else if (competitorData.averageContentQuality < 70) {
      score = 15;
    }
    // 一般竞争环境
    else {
      score = 10;
    }

    return score;
  }

  /**
   * 生成优化建议
   */
  private static generateRecommendations(
    factors: AIOAdaptabilityFactors, 
    _keyword: string
  ): string[] {
    const recommendations: string[] = [];

    // 问题类型优化建议
    if (factors.questionTypeMatch < 20) {
      recommendations.push('考虑将关键词调整为问题形式，如"How to..."或"What is..."');
    }

    // 搜索意图优化建议
    if (factors.searchIntentClarity < 15) {
      recommendations.push('增加信息型关键词，如"guide"、"tutorial"、"tips"等');
    }

    // 内容结构优化建议
    if (factors.contentStructure < 15) {
      recommendations.push('创建结构化内容，使用编号列表、步骤说明或FAQ格式');
    }

    // 竞争环境建议
    if (factors.competitiveEnvironment < 10) {
      if (factors.competitiveEnvironment === 0) {
        recommendations.push('该关键词已有AIO展示，建议寻找长尾变体或更具体的问题');
      } else {
        recommendations.push('提升内容质量，超越现有竞争对手的内容深度和准确性');
      }
    }

    // 额外的具体建议
    if (factors.questionTypeMatch + factors.searchIntentClarity >= 40) {
      recommendations.push('该关键词AIO潜力很高，建议优先创建详细的指南类内容');
    }

    return recommendations;
  }

  /**
   * 预测表现等级
   */
  private static predictPerformance(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 批量分析关键词的AIO适配性
   */
  static batchAnalyzeAIOAdaptability(
    keywords: Array<{ id: string; text: string; competitorData?: any }>
  ) {
    return keywords.map(item => ({
      id: item.id,
      keyword: item.text,
      analysis: this.calculateAIOScore(item.text, item.competitorData)
    }));
  }
}