import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  script: string;
  duration: number; // 秒
  platform: 'tiktok' | 'youtube-shorts' | 'instagram-reels' | 'wechat-channels';
  hooks: string[]; // 开场hook
  cta: string; // 行动号召
  hashtags: string[];
  thumbnail: {
    title: string;
    subtitle: string;
    visualElements: string[];
  };
  scenes: VideoScene[];
}

export interface VideoScene {
  sceneId: string;
  duration: number;
  visualDescription: string;
  voiceoverText: string;
  onScreenText?: string;
  transitionType: 'cut' | 'fade' | 'zoom' | 'slide';
  bgMusic?: string;
  effects?: string[];
}

export interface VideoStrategy {
  contentType: 'product-demo' | 'how-to' | 'problem-solution' | 'comparison' | 'unboxing' | 'testimonial';
  targetAudience: string;
  keyMessage: string;
  emotionalTone: 'exciting' | 'informative' | 'urgent' | 'trustworthy' | 'friendly';
  optimizationGoals: string[];
}

export interface VideoContentPlan {
  strategy: VideoStrategy;
  contentSeries: VideoContent[];
  distributionPlan: {
    platform: string;
    postingSchedule: string;
    customizations: string[];
  }[];
  performanceMetrics: string[];
  aiOptimizationTips: string[];
}

@Injectable()
export class ShortVideoContentService {
  private readonly platforms = ['tiktok', 'youtube-shorts', 'instagram-reels', 'wechat-channels'];
  private readonly contentTypes = ['product-demo', 'how-to', 'problem-solution', 'comparison', 'unboxing', 'testimonial'];
  
  constructor(private configService: ConfigService) {}

  /**
   * 核心：智能短视频内容生成
   */
  async generateVideoContentPlan(
    productName: string,
    targetKeywords: string[],
    targetPlatforms: string[] = this.platforms
  ): Promise<VideoContentPlan> {
    console.log(`🎬 为${productName}生成短视频内容计划...`);
    
    // 1. 分析产品和关键词，制定内容策略
    const strategy = await this.analyzeAndCreateStrategy(productName, targetKeywords);
    
    // 2. 为每个平台生成定制化内容
    const contentSeries = await this.generatePlatformSpecificContent(productName, targetKeywords, targetPlatforms, strategy);
    
    // 3. 制定分发计划
    const distributionPlan = await this.createDistributionPlan(targetPlatforms, contentSeries);
    
    // 4. 定义性能指标
    const performanceMetrics = await this.definePerformanceMetrics(strategy);
    
    // 5. 生成AI优化建议
    const aiOptimizationTips = await this.generateAIOptimizationTips(strategy, contentSeries);

    return {
      strategy,
      contentSeries,
      distributionPlan,
      performanceMetrics,
      aiOptimizationTips
    };
  }

  /**
   * 分析产品并创建内容策略
   */
  private async analyzeAndCreateStrategy(productName: string, keywords: string[]): Promise<VideoStrategy> {
    // 基于Eufy产品特性分析
    const isSecurityProduct = keywords.some(k => 
      k.toLowerCase().includes('camera') || 
      k.toLowerCase().includes('security') || 
      k.toLowerCase().includes('doorbell')
    );

    const isSmartHome = keywords.some(k => 
      k.toLowerCase().includes('smart') || 
      k.toLowerCase().includes('home') || 
      k.toLowerCase().includes('app')
    );

    // 确定内容类型
    let contentType: VideoStrategy['contentType'] = 'product-demo';
    if (keywords.some(k => k.includes('how to') || k.includes('setup'))) {
      contentType = 'how-to';
    } else if (keywords.some(k => k.includes('vs') || k.includes('comparison'))) {
      contentType = 'comparison';
    } else if (keywords.some(k => k.includes('review') || k.includes('unbox'))) {
      contentType = 'unboxing';
    }

    // 确定目标受众
    const targetAudience = isSecurityProduct 
      ? '关注家庭安全的家庭用户、房主、租客'
      : '智能家居爱好者、科技早期采用者';

    // 核心信息
    const keyMessage = isSecurityProduct 
      ? `${productName}提供先进的AI安防保护，让您的家更安全`
      : `${productName}让智能家居生活更便捷舒适`;

    // 情感色调
    const emotionalTone: VideoStrategy['emotionalTone'] = isSecurityProduct ? 'trustworthy' : 'exciting';

    // 优化目标
    const optimizationGoals = [
      '提高品牌认知度',
      '增加产品购买意向',
      '获得更多用户参与',
      '扩大社交媒体影响力',
      '建立产品权威性'
    ];

    return {
      contentType,
      targetAudience,
      keyMessage,
      emotionalTone,
      optimizationGoals
    };
  }

  /**
   * 为每个平台生成定制化内容
   */
  private async generatePlatformSpecificContent(
    productName: string,
    keywords: string[],
    platforms: string[],
    strategy: VideoStrategy
  ): Promise<VideoContent[]> {
    const contentSeries: VideoContent[] = [];

    for (const platform of platforms) {
      // 为每个平台生成3-5个不同角度的视频
      const videoAngles = await this.getVideoAnglesForPlatform(platform as any, strategy);
      
      for (const angle of videoAngles) {
        const video = await this.generateSingleVideoContent(
          productName,
          keywords,
          platform as any,
          strategy,
          angle
        );
        contentSeries.push(video);
      }
    }

    return contentSeries;
  }

  /**
   * 获取平台特定的视频角度
   */
  private async getVideoAnglesForPlatform(
    platform: VideoContent['platform'],
    strategy: VideoStrategy
  ): Promise<string[]> {
    const baseAngles = {
      'tiktok': [
        '15秒产品核心功能展示',
        '问题-解决方案故事',
        '用户真实使用场景',
        '产品安装过程快剪'
      ],
      'youtube-shorts': [
        '30秒详细功能介绍',
        '产品对比分析',
        '专业安装教程',
        '用户评价合集'
      ],
      'instagram-reels': [
        '美学化产品展示',
        '家居场景融入',
        '生活方式展现',
        '时尚科技元素'
      ],
      'wechat-channels': [
        '实用性功能解析',
        '家庭安全科普',
        '产品价值说明',
        '购买指导建议'
      ]
    };

    return baseAngles[platform] || baseAngles['tiktok'];
  }

  /**
   * 生成单个视频内容
   */
  private async generateSingleVideoContent(
    productName: string,
    keywords: string[],
    platform: VideoContent['platform'],
    strategy: VideoStrategy,
    angle: string
  ): Promise<VideoContent> {
    const videoId = `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // 根据平台调整时长
    const platformDuration = {
      'tiktok': 15,
      'youtube-shorts': 30,
      'instagram-reels': 30,
      'wechat-channels': 45
    };

    const duration = platformDuration[platform] || 30;

    // 生成标题
    const title = await this.generateVideoTitle(productName, angle, platform);
    
    // 生成描述
    const description = await this.generateVideoDescription(productName, keywords, strategy);
    
    // 生成脚本
    const script = await this.generateVideoScript(productName, angle, strategy, duration);
    
    // 生成开场hooks
    const hooks = await this.generateVideoHooks(angle, strategy);
    
    // 生成CTA
    const cta = await this.generateCTA(platform, strategy);
    
    // 生成hashtags
    const hashtags = await this.generateHashtags(productName, keywords, platform);
    
    // 生成缩略图
    const thumbnail = await this.generateThumbnail(productName, angle);
    
    // 生成场景
    const scenes = await this.generateVideoScenes(script, duration);

    return {
      id: videoId,
      title,
      description,
      script,
      duration,
      platform,
      hooks,
      cta,
      hashtags,
      thumbnail,
      scenes
    };
  }

  /**
   * 生成视频标题
   */
  private async generateVideoTitle(productName: string, angle: string, platform: VideoContent['platform']): Promise<string> {
    const titleTemplates = {
      'tiktok': [
        `这个${productName}功能太绝了！`,
        `${productName}真的能这样？`,
        `用了${productName}后，我家变成这样...`,
        `${productName}vs传统产品，差距这么大？`
      ],
      'youtube-shorts': [
        `${productName}完整评测：值得买吗？`,
        `${productName}安装教程：新手也能搞定`,
        `为什么选择${productName}？3个理由`,
        `${productName}使用一个月后的真实感受`
      ],
      'instagram-reels': [
        `✨ ${productName}让家更美好`,
        `📱 ${productName}智能生活体验`,
        `🏠 用${productName}打造理想家居`,
        `💝 ${productName}：科技与美学的完美结合`
      ],
      'wechat-channels': [
        `${productName}深度解析：功能、价格、使用体验`,
        `家庭安防必备：${productName}全面介绍`,
        `${productName}购买指南：如何选择合适型号`,
        `${productName}实用技巧分享`
      ]
    };

    const templates = titleTemplates[platform] || titleTemplates['tiktok'];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 生成视频描述
   */
  private async generateVideoDescription(
    productName: string,
    keywords: string[],
    strategy: VideoStrategy
  ): Promise<string> {
    const keywordPhrase = keywords.slice(0, 3).join(' | ');
    
    return `🔥 ${productName}${strategy.contentType === 'product-demo' ? '功能展示' : '详细介绍'}

${strategy.keyMessage}

🎯 适合人群：${strategy.targetAudience}

💡 核心亮点：
• 先进AI技术
• 简单易用设计  
• 专业安防保护
• 智能家居集成

🔍 相关搜索：${keywordPhrase}

📞 了解更多请访问官网或私信咨询
#Eufy #智能家居 #家庭安防`;
  }

  /**
   * 生成视频脚本
   */
  private async generateVideoScript(
    productName: string,
    angle: string,
    strategy: VideoStrategy,
    duration: number
  ): Promise<string> {
    const scriptStructure = {
      hook: Math.ceil(duration * 0.2), // 20%时间做开场
      content: Math.ceil(duration * 0.6), // 60%时间讲内容
      cta: Math.ceil(duration * 0.2) // 20%时间做结尾
    };

    const hookText = `想要${strategy.keyMessage.split('，')[1] || '更好的智能生活体验'}吗？`;
    
    const contentText = this.generateMainContent(productName, angle, strategy);
    
    const ctaText = '赶紧点赞收藏，让更多人看到！还有疑问请评论区留言～';

    return `【开场 ${scriptStructure.hook}秒】
${hookText}

【主要内容 ${scriptStructure.content}秒】
${contentText}

【结尾CTA ${scriptStructure.cta}秒】
${ctaText}`;
  }

  /**
   * 生成主要内容
   */
  private generateMainContent(productName: string, angle: string, strategy: VideoStrategy): string {
    const contentTemplates = {
      'product-demo': `${productName}的核心功能：
1. AI智能识别 - 准确区分家人和陌生人
2. 云端存储 - 重要时刻永不丢失  
3. 实时推送 - 第一时间了解家中情况
4. 超长续航 - 一次充电用半年`,

      'how-to': `${productName}安装超简单：
1. 下载官方App，注册账号
2. 按住设备配对键，添加设备
3. 选择安装位置，调整角度
4. 测试功能，设置推送偏好`,

      'problem-solution': `家庭安防痛点 vs ${productName}解决方案：
❌ 传统摄像头画质模糊 → ✅ 4K超清画质
❌ 误报率高 → ✅ AI精准识别
❌ 安装复杂 → ✅ 5分钟轻松搞定
❌ 隐私担忧 → ✅ 本地存储更安全`,

      'comparison': `${productName} vs 其他品牌：
📸 画质：${productName} 4K > 其他 1080P
🔋 续航：${productName} 6个月 > 其他 2个月
🧠 AI：${productName} 本地AI > 其他 云端识别
💰 价格：${productName} 性价比更高`,

      'unboxing': `${productName}开箱体验：
📦 包装简约大气，环保材料
📱 产品做工精致，手感优秀
📋 配件齐全：支架、螺丝、说明书
⚡ 充电快速，开机流畅`,

      'testimonial': `用户真实反馈${productName}：
"安装简单，画质清晰" - 张女士
"误报少，很智能" - 李先生  
"续航给力，省心" - 王女士
"客服专业，售后好" - 陈先生`
    };

    return contentTemplates[strategy.contentType] || contentTemplates['product-demo'];
  }

  /**
   * 生成视频hooks
   */
  private async generateVideoHooks(angle: string, strategy: VideoStrategy): Promise<string[]> {
    const hookCategories = {
      question: [
        '你知道吗？99%的人都不知道这个功能',
        '为什么这个产品这么火？',
        '花了3000块买这个，值得吗？'
      ],
      problem: [
        '家里总是被偷怎么办？',
        '出门总担心家里安全？',
        '监控总是看不清人脸？'
      ],
      benefit: [
        '用了这个后，我再也不担心家里安全了',
        '这个功能救了我一命',
        '省下的电费都够买一台了'
      ],
      curiosity: [
        '这个操作绝了，不看后悔',
        '藏在细节里的黑科技',
        '官方都不敢说的秘密'
      ]
    };

    // 根据策略选择合适的hook类型
    const hookType = strategy.emotionalTone === 'trustworthy' ? 'problem' : 
                    strategy.emotionalTone === 'exciting' ? 'curiosity' : 'question';

    return hookCategories[hookType] || hookCategories['question'];
  }

  /**
   * 生成CTA
   */
  private async generateCTA(platform: VideoContent['platform'], strategy: VideoStrategy): Promise<string> {
    const ctaTemplates = {
      'tiktok': [
        '双击点赞，让更多人看到！',
        '评论区说说你的想法',
        '关注我，更多好物分享'
      ],
      'youtube-shorts': [
        '觉得有用请点赞订阅',
        '评论告诉我你最关心什么',
        '分享给需要的朋友'
      ],
      'instagram-reels': [
        '点赞收藏，随时查看',
        'Story分享给朋友',
        '关注获取更多灵感'
      ],
      'wechat-channels': [
        '点赞支持，评论交流',
        '转发分享，帮助更多人',
        '关注我了解更多产品'
      ]
    };

    const templates = ctaTemplates[platform] || ctaTemplates['tiktok'];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 生成hashtags
   */
  private async generateHashtags(
    productName: string,
    keywords: string[],
    platform: VideoContent['platform']
  ): Promise<string[]> {
    const baseHashtags = ['Eufy', '智能家居', '家庭安防', '科技生活'];
    const keywordHashtags = keywords.slice(0, 3);
    
    const platformSpecific = {
      'tiktok': ['抖音好物', '种草', '数码好物', '生活vlog'],
      'youtube-shorts': ['科技评测', '产品介绍', '开箱', 'review'],
      'instagram-reels': ['tech', 'smarthome', 'lifestyle', 'design'],
      'wechat-channels': ['实用好物', '家居好物', '数码测评', '生活分享']
    };

    return [
      ...baseHashtags,
      ...keywordHashtags,
      ...(platformSpecific[platform] || platformSpecific['tiktok'])
    ].slice(0, 10);
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(productName: string, angle: string): Promise<VideoContent['thumbnail']> {
    return {
      title: productName,
      subtitle: angle.includes('功能') ? '核心功能展示' : '深度体验',
      visualElements: [
        '产品高清图片',
        '明亮背景',
        '突出文字',
        '箭头指示',
        '对比效果'
      ]
    };
  }

  /**
   * 生成视频场景
   */
  private async generateVideoScenes(script: string, duration: number): Promise<VideoScene[]> {
    const scenes: VideoScene[] = [];
    const sections = script.split('【').filter(s => s.trim());

    let currentTime = 0;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const timeMatch = section.match(/(\d+)秒/);
      const sceneDuration = timeMatch ? parseInt(timeMatch[1]) : Math.ceil(duration / sections.length);
      
      const isOpening = section.includes('开场');
      const isEnding = section.includes('结尾');
      
      scenes.push({
        sceneId: `scene_${i + 1}`,
        duration: sceneDuration,
        visualDescription: this.generateVisualDescription(section, isOpening, isEnding),
        voiceoverText: this.extractVoiceoverText(section),
        onScreenText: this.generateOnScreenText(section, isOpening, isEnding),
        transitionType: i === 0 ? 'fade' : 'cut',
        bgMusic: isOpening ? 'upbeat-intro' : isEnding ? 'call-to-action' : 'product-demo',
        effects: this.generateEffects(section, isOpening, isEnding)
      });

      currentTime += sceneDuration;
    }

    return scenes;
  }

  // 辅助方法
  private generateVisualDescription(section: string, isOpening: boolean, isEnding: boolean): string {
    if (isOpening) {
      return '产品特写镜头，配合动态文字动画';
    }
    if (isEnding) {
      return '用户点赞收藏动画，结合产品logo';
    }
    return '产品使用场景展示，功能操作演示';
  }

  private extractVoiceoverText(section: string): string {
    return section.split('】')[1] || section;
  }

  private generateOnScreenText(section: string, isOpening: boolean, isEnding: boolean): string | undefined {
    if (isOpening) return '想要更安全的家？';
    if (isEnding) return '点赞收藏关注';
    if (section.includes('功能')) return '核心功能';
    return undefined;
  }

  private generateEffects(section: string, isOpening: boolean, isEnding: boolean): string[] {
    const effects = [];
    if (isOpening) effects.push('zoom-in', 'text-animation');
    if (isEnding) effects.push('like-animation', 'subscribe-reminder');
    if (section.includes('对比')) effects.push('split-screen', 'comparison-animation');
    return effects;
  }

  /**
   * 创建分发计划
   */
  private async createDistributionPlan(
    platforms: string[],
    contentSeries: VideoContent[]
  ): Promise<VideoContentPlan['distributionPlan']> {
    return platforms.map(platform => {
      const platformContent = contentSeries.filter(content => content.platform === platform);
      
      return {
        platform,
        postingSchedule: this.getOptimalPostingSchedule(platform),
        customizations: [
          `优化${platform}算法偏好`,
          `调整内容长度适配${platform}`,
          `使用${platform}特色功能`,
          `符合${platform}用户习惯`
        ]
      };
    });
  }

  private getOptimalPostingSchedule(platform: string): string {
    const schedules = {
      'tiktok': '周一三五 19:00-21:00',
      'youtube-shorts': '周二四六 18:00-20:00',
      'instagram-reels': '周三五日 20:00-22:00',
      'wechat-channels': '周二四六 12:00-14:00, 19:00-21:00'
    };
    return schedules[platform] || '每周3次，晚高峰时段';
  }

  /**
   * 定义性能指标
   */
  private async definePerformanceMetrics(strategy: VideoStrategy): Promise<string[]> {
    return [
      '播放量 (目标: 10K+)',
      '点赞率 (目标: 5%+)',
      '评论率 (目标: 2%+)',
      '分享率 (目标: 1%+)',
      '完播率 (目标: 70%+)',
      '关注转化率 (目标: 0.5%+)',
      '品牌提及量增长',
      '产品页面访问量',
      '购买转化率',
      '用户参与度提升'
    ];
  }

  /**
   * 生成AI优化建议
   */
  private async generateAIOptimizationTips(
    strategy: VideoStrategy,
    contentSeries: VideoContent[]
  ): Promise<string[]> {
    return [
      '🎯 开场3秒决定成败 - 用强有力的hook抓住注意力',
      '📱 针对移动端优化 - 文字大小清晰，画面饱满',
      '🔄 建立内容矩阵 - 不同角度展示同一产品',
      '💬 鼓励用户互动 - 设置问题引导评论',
      '📊 数据驱动优化 - 根据表现调整内容策略',
      '🎵 背景音乐重要 - 选择符合品牌调性的音乐',
      '⏱️ 把握黄金时间 - 在最佳时段发布内容',
      '🔗 跨平台联动 - 在不同平台间引流',
      '👥 与KOL合作 - 借助影响者扩大影响力',
      '🎬 持续内容创新 - 跟上平台新功能和趋势'
    ];
  }

  /**
   * 批量生成内容计划
   */
  async generateBatchContentPlans(products: Array<{
    name: string;
    keywords: string[];
    platforms: string[];
  }>): Promise<Record<string, VideoContentPlan>> {
    const plans: Record<string, VideoContentPlan> = {};
    
    for (const product of products) {
      console.log(`🎬 为${product.name}生成内容计划...`);
      plans[product.name] = await this.generateVideoContentPlan(
        product.name,
        product.keywords,
        product.platforms
      );
    }
    
    return plans;
  }
}