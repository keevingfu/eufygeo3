import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RufusOptimizationInput {
  productName: string;
  productCategory: string;
  targetKeywords: string[];
  productFeatures: string[];
  competitorASINs?: string[];
  currentListing?: {
    title: string;
    bulletPoints: string[];
    description: string;
    searchTerms: string[];
  };
}

export interface RufusOptimizedContent {
  optimizedTitle: string;
  optimizedBulletPoints: string[];
  optimizedDescription: string;
  searchTerms: string[];
  rufusConversationStarters: string[];
  aiReadinessScore: number;
  rufusSpecificFeatures: {
    contextualAnswers: ContextualAnswer[];
    productComparisons: ProductComparison[];
    useCaseScenarios: UseCaseScenario[];
    troubleshootingGuide: TroubleshootingItem[];
  };
  optimizationRecommendations: string[];
}

export interface ContextualAnswer {
  question: string;
  answer: string;
  keywords: string[];
  confidenceScore: number;
}

export interface ProductComparison {
  comparisonPoint: string;
  ourAdvantage: string;
  supportingData: string;
  rufusPhrase: string;
}

export interface UseCaseScenario {
  scenario: string;
  description: string;
  benefits: string[];
  recommendedFor: string[];
}

export interface TroubleshootingItem {
  issue: string;
  solution: string;
  preventiveTips: string[];
  relatedKeywords: string[];
}

@Injectable()
export class AmazonRufusOptimizationService {
  private readonly rufusOptimizationCategories = [
    'conversational-queries',
    'product-comparisons', 
    'use-case-scenarios',
    'troubleshooting',
    'shopping-guidance',
    'feature-explanations'
  ];

  constructor(private configService: ConfigService) {}

  /**
   * 核心：Amazon Rufus AI购物助手优化
   */
  async optimizeForRufus(input: RufusOptimizationInput): Promise<RufusOptimizedContent> {
    console.log(`🛒 为${input.productName}优化Amazon Rufus AI助手体验...`);
    
    // 1. 分析产品特性和市场定位
    const productAnalysis = await this.analyzeProductForRufus(input);
    
    // 2. 优化产品listing内容
    const optimizedListing = await this.optimizeListingForRufus(input, productAnalysis);
    
    // 3. 生成Rufus特定功能
    const rufusFeatures = await this.generateRufusSpecificFeatures(input, productAnalysis);
    
    // 4. 生成对话启动器
    const conversationStarters = await this.generateConversationStarters(input);
    
    // 5. 计算AI就绪度评分
    const aiReadinessScore = await this.calculateRufusReadinessScore(optimizedListing, rufusFeatures);
    
    // 6. 生成优化建议
    const recommendations = await this.generateOptimizationRecommendations(input, aiReadinessScore);

    return {
      optimizedTitle: optimizedListing.title,
      optimizedBulletPoints: optimizedListing.bulletPoints,
      optimizedDescription: optimizedListing.description,
      searchTerms: optimizedListing.searchTerms,
      rufusConversationStarters: conversationStarters,
      aiReadinessScore,
      rufusSpecificFeatures: rufusFeatures,
      optimizationRecommendations: recommendations
    };
  }

  /**
   * 分析产品特性用于Rufus优化
   */
  private async analyzeProductForRufus(input: RufusOptimizationInput): Promise<{
    primaryBenefits: string[];
    uniqueSellingPoints: string[];
    commonQuestions: string[];
    competitorAnalysis: string[];
    targetCustomerSegments: string[];
  }> {
    // 智能家居安防产品特性分析
    const isSecurityProduct = input.productCategory.toLowerCase().includes('security') || 
                             input.targetKeywords.some(k => k.includes('camera') || k.includes('doorbell'));

    const primaryBenefits = isSecurityProduct ? [
      '24/7家庭安全监控',
      'AI智能人形检测',
      '本地存储保护隐私',
      '超长续航免维护',
      '简单安装无需布线'
    ] : [
      '智能家居生活体验',
      '语音控制便捷操作', 
      'App远程管理',
      '节能环保设计',
      '兼容主流智能平台'
    ];

    const uniqueSellingPoints = [
      '军工级加密技术',
      '本地AI处理',
      '防水防尘IP67',
      '6个月超长续航',
      '1080P夜视功能'
    ];

    const commonQuestions = [
      `${input.productName}和Ring有什么区别？`,
      `${input.productName}安装难不难？`,
      `${input.productName}需要订阅费用吗？`,
      `${input.productName}支持苹果HomeKit吗？`,
      `${input.productName}的隐私保护怎么样？`
    ];

    const competitorAnalysis = [
      'Ring：需要订阅服务，Eufy本地存储更安全',
      'Arlo：续航时间短，Eufy 6个月续航更省心',
      'Nest：价格较高，Eufy性价比更优',
      'Wyze：功能基础，Eufy AI功能更先进'
    ];

    const targetCustomerSegments = [
      '注重隐私的家庭用户',
      '追求性价比的消费者',
      '技术小白用户',
      '智能家居爱好者',
      '安全意识强的房主'
    ];

    return {
      primaryBenefits,
      uniqueSellingPoints,
      commonQuestions,
      competitorAnalysis,
      targetCustomerSegments
    };
  }

  /**
   * 优化listing内容以适配Rufus
   */
  private async optimizeListingForRufus(
    input: RufusOptimizationInput,
    analysis: any
  ): Promise<{
    title: string;
    bulletPoints: string[];
    description: string;
    searchTerms: string[];
  }> {
    // 优化标题 - 让Rufus更容易理解产品
    const optimizedTitle = await this.optimizeTitleForRufus(input.productName, input.targetKeywords, analysis);
    
    // 优化Bullet Points - 结构化特性描述
    const optimizedBulletPoints = await this.optimizeBulletPointsForRufus(input.productFeatures, analysis);
    
    // 优化产品描述 - 对话式、详细的说明
    const optimizedDescription = await this.optimizeDescriptionForRufus(input, analysis);
    
    // 优化搜索词 - 包含对话式查询
    const searchTerms = await this.generateRufusSearchTerms(input.targetKeywords, analysis.commonQuestions);

    return {
      title: optimizedTitle,
      bulletPoints: optimizedBulletPoints,
      description: optimizedDescription,
      searchTerms
    };
  }

  /**
   * 为Rufus优化标题
   */
  private async optimizeTitleForRufus(productName: string, keywords: string[], analysis: any): Promise<string> {
    // Rufus友好的标题格式：品牌 + 产品类型 + 主要特性 + 主要受益
    const mainKeyword = keywords[0];
    const primaryBenefit = analysis.primaryBenefits[0];
    
    return `Eufy ${productName} - ${mainKeyword} with ${analysis.uniqueSellingPoints[0]} for ${primaryBenefit}`;
  }

  /**
   * 为Rufus优化Bullet Points
   */
  private async optimizeBulletPointsForRufus(features: string[], analysis: any): Promise<string[]> {
    const optimizedBullets = [];
    
    // 第一个bullet：核心价值主张
    optimizedBullets.push(`🔒 ${analysis.primaryBenefits[0]} - ${analysis.uniqueSellingPoints[0]}为您的家庭提供全天候保护`);
    
    // 第二个bullet：AI智能特性
    optimizedBullets.push(`🤖 AI智能识别技术 - 精准区分家人、访客和入侵者，减少99%误报，让您安心无忧`);
    
    // 第三个bullet：便利性特性
    optimizedBullets.push(`⚡ 超长续航 + 简单安装 - 6个月续航，无需频繁充电；5分钟安装，无需专业技术`);
    
    // 第四个bullet：隐私和兼容性
    optimizedBullets.push(`🛡️ 隐私保护 + 智能兼容 - 本地存储保护隐私，支持Alexa、Google Assistant和Apple HomeKit`);
    
    // 第五个bullet：性价比和售后
    optimizedBullets.push(`💰 超值选择 + 专业支持 - 无月费订阅，一次购买终身使用；专业客服和完善售后保障`);

    return optimizedBullets;
  }

  /**
   * 为Rufus优化产品描述
   */
  private async optimizeDescriptionForRufus(input: RufusOptimizationInput, analysis: any): Promise<string> {
    return `**为什么选择Eufy ${input.productName}？**

Eufy ${input.productName}是专为现代家庭设计的智能安防解决方案。我们理解您对家庭安全和隐私保护的需求，因此打造了这款集先进技术与人性化设计于一体的产品。

**🎯 专为以下场景设计：**
${analysis.targetCustomerSegments.map(segment => `• ${segment}`).join('\n')}

**💡 为什么用户选择我们：**
${analysis.primaryBenefits.map(benefit => `• ${benefit}`).join('\n')}

**🔥 与竞品的关键差异：**
${analysis.competitorAnalysis.map(comp => `• ${comp}`).join('\n')}

**📱 使用简单：**
1. 下载Eufy Security App
2. 扫码添加设备
3. 选择安装位置
4. 享受智能安防保护

**🛡️ 品质保证：**
• 18个月质保期
• 专业客服支持
• 30天无理由退换
• 免费固件更新

**💬 常见问题快速解答：**
Q: 需要月费吗？A: 不需要，一次购买终身使用
Q: 支持苹果手机吗？A: 完美支持iOS和Android
Q: 安装复杂吗？A: 5分钟即可完成，无需专业工具
Q: 隐私安全吗？A: 本地存储，数据不上云，绝对安全

立即购买，让您的家更安全、更智能！`;
  }

  /**
   * 生成Rufus搜索词
   */
  private async generateRufusSearchTerms(keywords: string[], commonQuestions: string[]): Promise<string[]> {
    const searchTerms = [...keywords];
    
    // 添加对话式搜索词
    const conversationalTerms = [
      'best security camera for home',
      'wireless doorbell camera without subscription',
      'smart home security system',
      'battery powered security camera',
      'privacy focused security camera',
      'easy install security camera',
      'night vision security camera',
      'weatherproof outdoor camera',
      'smart doorbell with two way audio',
      'local storage security camera'
    ];
    
    // 添加问题式搜索词
    const questionTerms = commonQuestions.map(q => 
      q.toLowerCase().replace('？', '').replace('?', '')
    );
    
    // 添加比较式搜索词
    const comparisonTerms = [
      'eufy vs ring doorbell',
      'eufy vs arlo camera',
      'eufy vs nest doorbell',
      'best alternative to ring',
      'security camera without monthly fee'
    ];

    return [
      ...searchTerms,
      ...conversationalTerms,
      ...questionTerms.slice(0, 5),
      ...comparisonTerms
    ].slice(0, 50); // Amazon限制搜索词数量
  }

  /**
   * 生成Rufus特定功能
   */
  private async generateRufusSpecificFeatures(
    input: RufusOptimizationInput,
    analysis: any
  ): Promise<RufusOptimizedContent['rufusSpecificFeatures']> {
    
    const contextualAnswers = await this.generateContextualAnswers(input, analysis);
    const productComparisons = await this.generateProductComparisons(input, analysis);
    const useCaseScenarios = await this.generateUseCaseScenarios(input, analysis);
    const troubleshootingGuide = await this.generateTroubleshootingGuide(input);

    return {
      contextualAnswers,
      productComparisons,
      useCaseScenarios,
      troubleshootingGuide
    };
  }

  /**
   * 生成上下文回答
   */
  private async generateContextualAnswers(input: RufusOptimizationInput, analysis: any): Promise<ContextualAnswer[]> {
    return [
      {
        question: `${input.productName}适合什么样的家庭？`,
        answer: `${input.productName}特别适合${analysis.targetCustomerSegments.join('、')}。无论您是技术小白还是智能家居爱好者，都能轻松使用。`,
        keywords: ['适合', '家庭', '用户'],
        confidenceScore: 0.95
      },
      {
        question: `${input.productName}的安装难度如何？`,
        answer: `安装非常简单！只需5分钟即可完成，无需专业工具或技术知识。产品包装内含详细说明书和所有必需配件。`,
        keywords: ['安装', '简单', '工具'],
        confidenceScore: 0.9
      },
      {
        question: `${input.productName}的隐私保护怎么样？`,
        answer: `隐私保护是我们的核心优势。采用本地存储，数据不上云，军工级加密技术，确保您的隐私绝对安全。`,
        keywords: ['隐私', '安全', '本地存储'],
        confidenceScore: 0.98
      },
      {
        question: `${input.productName}需要付月费吗？`,
        answer: `完全不需要！一次购买，终身使用。没有任何隐藏费用或订阅服务，为您节省每年数百元的订阅费用。`,
        keywords: ['月费', '订阅', '费用'],
        confidenceScore: 0.99
      },
      {
        question: `${input.productName}和Ring/Arlo相比有什么优势？`,
        answer: `主要优势包括：${analysis.competitorAnalysis.join('；')}。整体性价比和用户体验都更优秀。`,
        keywords: ['对比', '优势', '性价比'],
        confidenceScore: 0.92
      }
    ];
  }

  /**
   * 生成产品对比
   */
  private async generateProductComparisons(input: RufusOptimizationInput, analysis: any): Promise<ProductComparison[]> {
    return [
      {
        comparisonPoint: '订阅费用',
        ourAdvantage: '无需月费，一次购买终身使用',
        supportingData: '相比Ring每月节省$3-10订阅费，一年节省$36-120',
        rufusPhrase: `${input.productName}无需任何订阅费用，为您节省大量后续成本`
      },
      {
        comparisonPoint: '续航时间',
        ourAdvantage: '6个月超长续航',
        supportingData: '普通产品2-3个月续航，我们的产品续航时间延长2-3倍',
        rufusPhrase: `${input.productName}拥有行业领先的6个月续航，减少充电麻烦`
      },
      {
        comparisonPoint: '隐私保护',
        ourAdvantage: '本地存储，数据不上云',
        supportingData: '采用本地存储技术，避免云端数据泄露风险',
        rufusPhrase: `${input.productName}将您的隐私放在第一位，本地存储更安全`
      },
      {
        comparisonPoint: 'AI智能程度',
        ourAdvantage: '本地AI处理，响应更快',
        supportingData: '本地AI算法，响应速度比云端AI快50%以上',
        rufusPhrase: `${input.productName}的本地AI技术提供更快更准确的识别`
      }
    ];
  }

  /**
   * 生成使用场景
   */
  private async generateUseCaseScenarios(input: RufusOptimizationInput, analysis: any): Promise<UseCaseScenario[]> {
    return [
      {
        scenario: '家庭日常安全监控',
        description: '24/7监控家门口，实时了解访客情况，保护家庭安全',
        benefits: ['实时推送通知', 'AI人形检测', '双向语音对讲', '夜视功能'],
        recommendedFor: ['有小孩的家庭', '独居人群', '经常出差的用户']
      },
      {
        scenario: '快递包裹防盗',
        description: '监控门口包裹投递，防止包裹被盗',
        benefits: ['投递通知', '录像取证', '远程查看', '云端备份'],
        recommendedFor: ['网购频繁的用户', '公寓住户', '上班族']
      },
      {
        scenario: '宠物和老人看护',
        description: '关注家中宠物和老人的安全状况',
        benefits: ['活动检测', '异常提醒', '历史回放', '家人共享'],
        recommendedFor: ['养宠物家庭', '有老人的家庭', '关心家人安全的用户']
      },
      {
        scenario: '出租房屋管理',
        description: '房东远程监控出租房屋状况',
        benefits: ['租客进出记录', '房屋状态监控', '远程管理', '证据收集'],
        recommendedFor: ['房东', '民宿经营者', '房产管理公司']
      }
    ];
  }

  /**
   * 生成故障排除指南
   */
  private async generateTroubleshootingGuide(input: RufusOptimizationInput): Promise<TroubleshootingItem[]> {
    return [
      {
        issue: `${input.productName}连接不上WiFi`,
        solution: '1. 确认WiFi密码正确 2. 重启路由器 3. 重置设备后重新配对 4. 确保使用2.4GHz频段',
        preventiveTips: ['定期更新设备固件', '保持路由器稳定', '避免频繁更改WiFi密码'],
        relatedKeywords: ['wifi连接', '网络问题', '连接失败']
      },
      {
        issue: `${input.productName}画面模糊`,
        solution: '1. 清洁镜头表面 2. 检查网络带宽 3. 调整画质设置 4. 确认安装位置稳固',
        preventiveTips: ['定期清洁镜头', '保证网络稳定', '避免逆光安装'],
        relatedKeywords: ['画面模糊', '清晰度', '画质问题']
      },
      {
        issue: `${input.productName}电池续航短`,
        solution: '1. 降低录像频率 2. 调整PIR灵敏度 3. 关闭不必要功能 4. 检查固件版本',
        preventiveTips: ['合理设置检测区域', '定期充电保养', '避免极端温度环境'],
        relatedKeywords: ['电池续航', '充电问题', '电量不足']
      },
      {
        issue: `${input.productName}误报频繁`,
        solution: '1. 调整检测灵敏度 2. 设置检测区域 3. 更新AI算法 4. 优化安装角度',
        preventiveTips: ['合理设置检测参数', '定期固件更新', '避开干扰源'],
        relatedKeywords: ['误报', '检测设置', '灵敏度']
      }
    ];
  }

  /**
   * 生成对话启动器
   */
  private async generateConversationStarters(input: RufusOptimizationInput): Promise<string[]> {
    return [
      `告诉我更多关于${input.productName}的信息`,
      `${input.productName}适合我的家庭吗？`,
      `${input.productName}和其他品牌有什么不同？`,
      `${input.productName}安装复杂吗？`,
      `${input.productName}需要订阅服务吗？`,
      `${input.productName}的隐私保护怎么样？`,
      `${input.productName}的电池能用多久？`,
      `${input.productName}支持哪些智能平台？`,
      `${input.productName}的夜视效果如何？`,
      `如果${input.productName}出现问题怎么办？`
    ];
  }

  /**
   * 计算Rufus就绪度评分
   */
  private async calculateRufusReadinessScore(
    listing: any,
    features: RufusOptimizedContent['rufusSpecificFeatures']
  ): Promise<number> {
    let score = 0;

    // 标题优化程度 (20分)
    const titleScore = this.assessTitleRufusOptimization(listing.title);
    score += titleScore * 0.2;

    // Bullet Points结构化程度 (20分)
    const bulletScore = this.assessBulletPointsStructure(listing.bulletPoints);
    score += bulletScore * 0.2;

    // 描述对话友好度 (20分)
    const descriptionScore = this.assessDescriptionConversational(listing.description);
    score += descriptionScore * 0.2;

    // 上下文回答完整性 (20分)
    const contextScore = features.contextualAnswers.length >= 5 ? 1 : features.contextualAnswers.length / 5;
    score += contextScore * 0.2;

    // 功能完整性 (20分)
    const featureCompleteness = (
      (features.productComparisons.length >= 3 ? 1 : 0) +
      (features.useCaseScenarios.length >= 3 ? 1 : 0) +
      (features.troubleshootingGuide.length >= 3 ? 1 : 0)
    ) / 3;
    score += featureCompleteness * 0.2;

    return Math.round(score * 100) / 100;
  }

  /**
   * 生成优化建议
   */
  private async generateOptimizationRecommendations(
    input: RufusOptimizationInput,
    score: number
  ): Promise<string[]> {
    const recommendations = [];

    if (score < 0.7) {
      recommendations.push('🎯 整体Rufus优化程度需要提升，建议重点优化对话式内容');
    }

    if (score < 0.8) {
      recommendations.push('💬 增加更多对话式描述，让Rufus更容易理解产品特性');
    }

    recommendations.push('🔍 持续监控Rufus问答效果，根据用户反馈优化内容');
    recommendations.push('📊 定期分析Rufus相关搜索词表现，调整优化策略');
    recommendations.push('🤖 关注Amazon Rufus功能更新，及时调整优化方向');
    recommendations.push('💡 利用A/B测试不同的产品描述，找到最佳Rufus适配方案');
    
    return recommendations;
  }

  // 辅助评分方法
  private assessTitleRufusOptimization(title: string): number {
    let score = 0.5;
    if (title.includes('with') || title.includes('for')) score += 0.2;
    if (title.length > 50 && title.length < 200) score += 0.2;
    if (/\b(AI|smart|wireless|battery|security)\b/i.test(title)) score += 0.1;
    return Math.min(score, 1);
  }

  private assessBulletPointsStructure(bullets: string[]): number {
    let score = bullets.length >= 5 ? 0.3 : bullets.length / 5 * 0.3;
    const hasEmojis = bullets.some(b => /[\u{1F300}-\u{1F9FF}]/u.test(b));
    const hasNumbers = bullets.some(b => /\d+/.test(b));
    const hasBenefits = bullets.some(b => /(保护|安全|智能|便捷)/.test(b));
    
    if (hasEmojis) score += 0.2;
    if (hasNumbers) score += 0.2;
    if (hasBenefits) score += 0.3;
    
    return Math.min(score, 1);
  }

  private assessDescriptionConversational(description: string): number {
    let score = 0.3;
    const hasQuestions = (description.match(/\?/g) || []).length;
    const hasPersonalPronoun = /(您|你|我们|用户)/g.test(description);
    const hasScenarios = /(适合|场景|使用|体验)/.test(description);
    
    if (hasQuestions >= 3) score += 0.3;
    if (hasPersonalPronoun) score += 0.2;
    if (hasScenarios) score += 0.2;
    
    return Math.min(score, 1);
  }

  /**
   * 批量优化多个产品
   */
  async batchOptimizeForRufus(products: RufusOptimizationInput[]): Promise<Record<string, RufusOptimizedContent>> {
    const results: Record<string, RufusOptimizedContent> = {};
    
    for (const product of products) {
      console.log(`🛒 优化${product.productName}的Rufus体验...`);
      results[product.productName] = await this.optimizeForRufus(product);
    }
    
    return results;
  }
}