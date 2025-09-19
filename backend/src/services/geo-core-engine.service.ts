import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GEOContentInput {
  title: string;
  content: string;
  type: 'faq' | 'how-to' | 'comparison' | 'product-info';
  targetKeywords: string[];
  sourceUrl?: string;
}

export interface GEOOptimizedContent {
  originalContent: string;
  optimizedContent: string;
  structuredData: any;
  aiReadinessScore: number;
  recommendedImprovements: string[];
  metaTags: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface AIEngineCompatibility {
  googleSGE: number;
  bingChat: number;
  perplexity: number;
  chatGPT: number;
  overall: number;
}

@Injectable()
export class GEOCoreEngineService {
  constructor(private _configService: ConfigService) {
    // ConfigService available for future use
  }

  /**
   * 核心GEO内容优化
   */
  async optimizeForGEO(input: GEOContentInput): Promise<GEOOptimizedContent> {
    console.log(`🚀 GEO优化开始: ${input.title}`);
    
    // 1. 语义分析和结构化
    const structuredData = await this.generateStructuredData(input);
    
    // 2. AI友好性优化
    const optimizedContent = await this.optimizeForAIUnderstanding(input);
    
    // 3. 权威性评分
    const aiReadinessScore = await this.calculateAIReadinessScore(optimizedContent);
    
    // 4. 改进建议
    const improvements = await this.generateImprovements(input, aiReadinessScore);
    
    // 5. 元数据优化
    const metaTags = await this.optimizeMetaTags(input);

    return {
      originalContent: input.content,
      optimizedContent,
      structuredData,
      aiReadinessScore,
      recommendedImprovements: improvements,
      metaTags
    };
  }

  /**
   * 生成结构化数据
   */
  private async generateStructuredData(input: GEOContentInput): Promise<any> {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': this.getSchemaType(input.type),
      'name': input.title,
      'description': input.content.substring(0, 160),
      'author': {
        '@type': 'Organization',
        'name': 'Eufy',
        'url': 'https://www.eufy.com'
      },
      'dateModified': new Date().toISOString(),
      'inLanguage': 'en-US'
    };

    // 根据内容类型添加特定字段
    switch (input.type) {
      case 'faq':
        return {
          ...baseSchema,
          '@type': 'FAQPage',
          'mainEntity': await this.extractFAQEntities(input.content)
        };
      
      case 'how-to':
        return {
          ...baseSchema,
          '@type': 'HowTo',
          'step': await this.extractHowToSteps(input.content)
        };
      
      case 'comparison':
        return {
          ...baseSchema,
          '@type': 'ComparisonPage',
          'mainEntity': await this.extractComparisonEntities(input.content)
        };
      
      case 'product-info':
        return {
          ...baseSchema,
          '@type': 'Product',
          'category': 'Smart Home Security',
          'manufacturer': 'Eufy'
        };
      
      default:
        return baseSchema;
    }
  }

  /**
   * AI理解优化
   */
  private async optimizeForAIUnderstanding(input: GEOContentInput): Promise<string> {
    let optimizedContent = input.content;

    // 1. 添加明确的问题陈述
    if (input.type === 'faq' || input.type === 'how-to') {
      const question = this.extractOrGenerateQuestion(input.title);
      optimizedContent = `**Question:** ${question}\n\n**Answer:** ${optimizedContent}`;
    }

    // 2. 结构化段落
    optimizedContent = this.addStructuralMarkers(optimizedContent);

    // 3. 添加上下文信息
    optimizedContent = this.addContextualInformation(optimizedContent, input);

    // 4. 优化语义清晰度
    optimizedContent = this.enhanceSemanticClarity(optimizedContent);

    return optimizedContent;
  }

  /**
   * 计算AI就绪度评分
   */
  private async calculateAIReadinessScore(content: string): Promise<number> {
    let score = 0;
    
    // 清晰度评分 (25分)
    const clarityScore = this.assessClarity(content);
    score += clarityScore * 0.25;

    // 结构化程度 (25分)
    const structureScore = this.assessStructure(content);
    score += structureScore * 0.25;

    // 权威性指标 (25分)
    const authorityScore = this.assessAuthority(content);
    score += authorityScore * 0.25;

    // 上下文完整性 (25分)
    const contextScore = this.assessContext(content);
    score += contextScore * 0.25;

    return Math.round(score * 100) / 100;
  }

  /**
   * 生成改进建议
   */
  private async generateImprovements(input: GEOContentInput, score: number): Promise<string[]> {
    const improvements: string[] = [];

    if (score < 0.7) {
      improvements.push('内容需要更清晰的结构化组织');
    }

    if (!input.content.includes('数据') && !input.content.includes('统计')) {
      improvements.push('添加具体数据和统计信息以增强权威性');
    }

    if (input.content.length < 300) {
      improvements.push('内容深度不足，建议扩展至300字以上');
    }

    if (!this.hasActionableAdvice(input.content)) {
      improvements.push('添加具体的行动建议或解决方案');
    }

    if (!this.hasComparisons(input.content) && input.targetKeywords.some(k => k.includes('vs') || k.includes('比较'))) {
      improvements.push('添加产品对比信息以满足比较查询需求');
    }

    return improvements;
  }

  /**
   * 优化元标签
   */
  private async optimizeMetaTags(input: GEOContentInput): Promise<any> {
    // AI友好的标题优化
    const optimizedTitle = this.optimizeTitleForAI(input.title, input.targetKeywords);
    
    // 描述优化（为AI摘要准备）
    const optimizedDescription = this.generateAIFriendlyDescription(input.content, input.targetKeywords);

    return {
      title: optimizedTitle,
      description: optimizedDescription,
      keywords: input.targetKeywords
    };
  }

  /**
   * 评估AI引擎兼容性
   */
  async assessAIEngineCompatibility(content: string): Promise<AIEngineCompatibility> {
    const googleSGE = this.assessGoogleSGECompatibility(content);
    const bingChat = this.assessBingChatCompatibility(content);
    const perplexity = this.assessPerplexityCompatibility(content);
    const chatGPT = this.assessChatGPTCompatibility(content);

    const overall = (googleSGE + bingChat + perplexity + chatGPT) / 4;

    return {
      googleSGE,
      bingChat,
      perplexity,
      chatGPT,
      overall
    };
  }

  // 辅助方法
  private getSchemaType(type: string): string {
    const typeMap = {
      'faq': 'FAQPage',
      'how-to': 'HowTo',
      'comparison': 'WebPage',
      'product-info': 'Product'
    };
    return (typeMap as any)[type] || 'WebPage';
  }

  private async extractFAQEntities(content: string): Promise<any[]> {
    // 使用正则表达式或AI来提取FAQ结构
    const questions = content.split(/\n\s*\n/).filter(para => 
      para.trim().endsWith('?') || para.toLowerCase().includes('问') || para.toLowerCase().includes('what') || para.toLowerCase().includes('how')
    );

    return questions.map(q => ({
      '@type': 'Question',
      'name': q.trim(),
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': '详细答案需要从内容中提取...'
      }
    }));
  }

  private async extractHowToSteps(content: string): Promise<any[]> {
    // 提取步骤信息
    const steps = content.split(/步骤|Step|\d+\./).filter(step => step.trim().length > 10);
    
    return steps.map((step, index) => ({
      '@type': 'HowToStep',
      'position': index + 1,
      'name': `步骤 ${index + 1}`,
      'text': step.trim()
    }));
  }

  private async extractComparisonEntities(content: string): Promise<any[]> {
    // 提取对比实体
    return [{
      '@type': 'Thing',
      'name': 'Product Comparison',
      'description': content.substring(0, 200)
    }];
  }

  private extractOrGenerateQuestion(title: string): string {
    if (title.endsWith('?')) return title;
    
    // 生成问题格式
    if (title.toLowerCase().includes('how')) {
      return title.endsWith('?') ? title : `${title}?`;
    }
    
    return `What about ${title}?`;
  }

  private addStructuralMarkers(content: string): string {
    // 添加结构化标记
    return content
      .replace(/(?:^|\n)((?:优点|优势|好处).*?)$/gm, '\n**优势:**\n$1')
      .replace(/(?:^|\n)((?:缺点|不足|问题).*?)$/gm, '\n**注意事项:**\n$1')
      .replace(/(?:^|\n)((?:步骤|方法|操作).*?)$/gm, '\n**操作步骤:**\n$1');
  }

  private addContextualInformation(content: string, input: GEOContentInput): string {
    const context = `\n\n**相关产品:** Eufy智能家居安防系统\n**适用场景:** ${input.targetKeywords.join(', ')}\n`;
    return content + context;
  }

  private enhanceSemanticClarity(content: string): string {
    // 增强语义清晰度
    return content
      .replace(/它/g, 'Eufy设备')
      .replace(/这个/g, '该功能')
      .replace(/那个/g, '相关产品');
  }

  private assessClarity(content: string): number {
    let score = 0.5; // 基础分
    
    // 有明确的问题和答案结构
    if (content.includes('**Question:**') && content.includes('**Answer:**')) {
      score += 0.3;
    }
    
    // 有具体的数字和数据
    if (/\d+%|\d+倍|\d+分钟|\d+米/.test(content)) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  private assessStructure(content: string): number {
    let score = 0.3; // 基础分
    
    // 有标题结构
    if (content.includes('**') || content.includes('##')) {
      score += 0.3;
    }
    
    // 有列表结构
    if (/^\s*[-*]\s/m.test(content) || /^\s*\d+\.\s/m.test(content)) {
      score += 0.2;
    }
    
    // 段落长度适中
    const paragraphs = content.split('\n\n');
    const avgLength = paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length;
    if (avgLength > 50 && avgLength < 200) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  private assessAuthority(content: string): number {
    let score = 0.4; // 基础分
    
    // 包含品牌名称
    if (content.toLowerCase().includes('eufy')) {
      score += 0.2;
    }
    
    // 包含技术规格
    if (/\d+K分辨率|\d+毫安|\d+米|IP\d+/.test(content)) {
      score += 0.2;
    }
    
    // 包含认证信息
    if (/FCC|CE认证|质保|保修/.test(content)) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  private assessContext(content: string): number {
    let score = 0.4; // 基础分
    
    // 有使用场景描述
    if (/家庭|办公室|室外|门口|客厅/.test(content)) {
      score += 0.2;
    }
    
    // 有解决的问题描述
    if (/安全|监控|保护|防盗/.test(content)) {
      score += 0.2;
    }
    
    // 有相关产品提及
    if (/摄像头|门铃|传感器|App/.test(content)) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  private hasActionableAdvice(content: string): boolean {
    return /建议|推荐|设置|配置|安装|步骤/.test(content);
  }

  private hasComparisons(content: string): boolean {
    return /vs|对比|比较|相比|差异/.test(content);
  }

  private optimizeTitleForAI(title: string, keywords: string[]): string {
    // 确保标题包含主要关键词且适合AI理解
    const mainKeyword = keywords[0];
    if (mainKeyword && !title.toLowerCase().includes(mainKeyword.toLowerCase())) {
      return `${title} - ${mainKeyword}`;
    }
    return title;
  }

  private generateAIFriendlyDescription(content: string, keywords: string[]): string {
    // 生成AI友好的描述
    const firstSentence = content.split(/[.!?。！？]/)[0];
    const keywordPhrase = keywords.slice(0, 2).join('和');
    
    return `关于${keywordPhrase}的专业指南。${firstSentence}。详细解答用户关于Eufy智能家居产品的常见问题。`;
  }

  private assessGoogleSGECompatibility(content: string): number {
    let score = 0.6;
    
    // Google SGE偏好权威性和数据支撑
    if (/\d+%|\d+倍|研究显示|数据表明/.test(content)) {
      score += 0.2;
    }
    
    // 偏好结构化内容
    if (content.includes('**') && /^\s*\d+\.\s/m.test(content)) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  private assessBingChatCompatibility(content: string): number {
    let score = 0.7;
    
    // Bing Chat偏好对话式内容
    if (/你|您|我们|问题|解答/.test(content)) {
      score += 0.15;
    }
    
    // 偏好实用性建议
    if (/建议|推荐|提示|注意/.test(content)) {
      score += 0.15;
    }
    
    return Math.min(score, 1);
  }

  private assessPerplexityCompatibility(content: string): number {
    let score = 0.5;
    
    // Perplexity偏好事实密集的内容
    if (content.split(/[.!?。！？]/).length > 5) {
      score += 0.2;
    }
    
    // 偏好技术细节
    if (/技术|规格|参数|性能/.test(content)) {
      score += 0.3;
    }
    
    return Math.min(score, 1);
  }

  private assessChatGPTCompatibility(content: string): number {
    let score = 0.6;
    
    // ChatGPT偏好全面的解释
    if (content.length > 500) {
      score += 0.2;
    }
    
    // 偏好示例和类比
    if (/例如|比如|就像|类似/.test(content)) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }
}