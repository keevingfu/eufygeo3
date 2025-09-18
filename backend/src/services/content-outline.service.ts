import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleApisService } from './google-apis.service';
import axios from 'axios';
import OpenAI from 'openai';

interface ContentOutline {
  title: string;
  meta_description: string;
  target_keyword: string;
  word_count: number;
  sections: OutlineSection[];
  keywords_to_include: string[];
  questions_to_answer: string[];
  competitor_insights: any[];
}

interface OutlineSection {
  heading: string;
  level: number; // H1, H2, H3
  content_points: string[];
  keywords: string[];
  word_count_estimate: number;
  subsections?: OutlineSection[];
}

@Injectable()
export class ContentOutlineService {
  private readonly logger = new Logger(ContentOutlineService.name);
  private readonly firecrawlApiKey: string;
  private readonly firecrawlBaseUrl = 'https://api.firecrawl.dev/v0';
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private googleApisService: GoogleApisService
  ) {
    this.firecrawlApiKey = this.configService.get<string>('FIRECRAWL_API_KEY');
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * 生成智能内容大纲
   */
  async generateContentOutline(keyword: string, contentType: string = 'blog'): Promise<ContentOutline> {
    try {
      // 1. 获取 SERP 数据和竞争对手内容
      const serpData = await this.googleApisService.searchKeywordData(keyword);
      const serpFeatures = await this.googleApisService.analyzeSerpFeatures(keyword);
      
      // 2. 分析排名前 5 的页面
      const topCompetitors = await this.analyzeTopCompetitors(serpData.organic_results.slice(0, 5));
      
      // 3. 提取相关问题和关键词
      const relatedQuestions = this.extractQuestions(serpData);
      const relatedKeywords = this.extractRelatedKeywords(serpData);
      
      // 4. 基于分析生成大纲
      const outline = await this.createOutlineFromAnalysis({
        keyword,
        contentType,
        serpData,
        serpFeatures,
        topCompetitors,
        relatedQuestions,
        relatedKeywords
      });
      
      return outline;
    } catch (error) {
      this.logger.error(`生成内容大纲失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 分析竞争对手内容
   */
  private async analyzeTopCompetitors(topResults: any[]) {
    const competitorAnalysis = [];
    
    for (const result of topResults) {
      try {
        // 使用 FireCrawl API 抓取和分析页面内容
        const scraped = await this.scrapeWebPage(result.link);
        
        if (scraped) {
          const analysis = {
            url: result.link,
            title: result.title,
            word_count: scraped.word_count,
            headings: scraped.headings,
            main_topics: scraped.main_topics,
            content_structure: scraped.structure,
            meta_description: scraped.meta_description,
            keywords_density: scraped.keywords_density
          };
          
          competitorAnalysis.push(analysis);
        }
      } catch (error) {
        this.logger.warn(`分析竞争对手页面失败: ${result.link}`);
      }
    }
    
    return competitorAnalysis;
  }

  /**
   * 使用 FireCrawl 抓取网页内容
   */
  private async scrapeWebPage(url: string) {
    try {
      const response = await axios.post(
        `${this.firecrawlBaseUrl}/scrape`,
        {
          url: url,
          formats: ['markdown', 'html']
        },
        {
          headers: {
            'Authorization': `Bearer ${this.firecrawlApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const content = response.data.data;
      
      // 分析内容结构
      return {
        word_count: content.markdown?.split(/\s+/).length || 0,
        headings: this.extractHeadings(content.markdown || ''),
        main_topics: this.extractMainTopics(content.markdown || ''),
        structure: this.analyzeContentStructure(content.markdown || ''),
        meta_description: content.metadata?.description || '',
        keywords_density: this.calculateKeywordDensity(content.markdown || '')
      };
    } catch (error) {
      this.logger.error(`FireCrawl 抓取失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 提取标题结构
   */
  private extractHeadings(markdown: string): any[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;
    
    while ((match = headingRegex.exec(markdown)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2],
        type: `H${match[1].length}`
      });
    }
    
    return headings;
  }

  /**
   * 提取主要主题
   */
  private extractMainTopics(content: string): string[] {
    // 简单的主题提取，实际应用中可以使用 NLP 服务
    const sentences = content.split(/[.!?]+/);
    const topics = new Set<string>();
    
    // 提取包含关键模式的句子作为主题
    const topicPatterns = [
      /how to/i,
      /what is/i,
      /why/i,
      /when/i,
      /benefits of/i,
      /types of/i,
      /guide to/i,
      /tips for/i
    ];
    
    sentences.forEach(sentence => {
      topicPatterns.forEach(pattern => {
        if (pattern.test(sentence)) {
          topics.add(sentence.trim());
        }
      });
    });
    
    return Array.from(topics).slice(0, 10);
  }

  /**
   * 分析内容结构
   */
  private analyzeContentStructure(content: string): any {
    const structure = {
      introduction_length: 0,
      body_sections: 0,
      conclusion_length: 0,
      lists_count: 0,
      images_count: 0,
      links_count: 0
    };
    
    // 统计列表
    structure.lists_count = (content.match(/^[\*\-]\s/gm) || []).length;
    
    // 统计链接
    structure.links_count = (content.match(/\[.+?\]\(.+?\)/g) || []).length;
    
    // 统计图片
    structure.images_count = (content.match(/!\[.+?\]\(.+?\)/g) || []).length;
    
    // 分析段落结构
    const paragraphs = content.split(/\n\n+/);
    if (paragraphs.length > 0) {
      structure.introduction_length = paragraphs[0].split(/\s+/).length;
      structure.body_sections = Math.max(0, paragraphs.length - 2);
      if (paragraphs.length > 1) {
        structure.conclusion_length = paragraphs[paragraphs.length - 1].split(/\s+/).length;
      }
    }
    
    return structure;
  }

  /**
   * 计算关键词密度
   */
  private calculateKeywordDensity(content: string): any {
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq: { [key: string]: number } = {};
    
    words.forEach(word => {
      if (word.length > 3) { // 忽略短词
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // 按频率排序
    const sorted = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);
    
    return Object.fromEntries(sorted);
  }

  /**
   * 提取相关问题
   */
  private extractQuestions(serpData: any): string[] {
    const questions = [];
    
    // 从 People Also Ask 提取
    if (serpData.people_also_ask) {
      questions.push(...serpData.people_also_ask.map((q: any) => q.question));
    }
    
    // 从相关搜索提取问题
    if (serpData.related_searches) {
      serpData.related_searches.forEach((search: any) => {
        if (search.query.includes('?') || 
            search.query.match(/^(what|how|why|when|where|who|which)/i)) {
          questions.push(search.query);
        }
      });
    }
    
    return questions;
  }

  /**
   * 提取相关关键词
   */
  private extractRelatedKeywords(serpData: any): string[] {
    const keywords = new Set<string>();
    
    // 从相关搜索提取
    if (serpData.related_searches) {
      serpData.related_searches.forEach((search: any) => {
        keywords.add(search.query);
      });
    }
    
    // 从知识图谱提取
    if (serpData.knowledge_graph?.attributes) {
      Object.values(serpData.knowledge_graph.attributes).forEach((value: any) => {
        if (typeof value === 'string') {
          keywords.add(value);
        }
      });
    }
    
    return Array.from(keywords);
  }

  /**
   * 基于分析创建大纲
   */
  private async createOutlineFromAnalysis(analysisData: any): Promise<ContentOutline> {
    const { keyword, contentType, serpData, serpFeatures, topCompetitors, relatedQuestions, relatedKeywords } = analysisData;
    
    // 计算推荐字数（基于竞争对手平均值）
    const avgWordCount = topCompetitors.length > 0
      ? Math.round(topCompetitors.reduce((sum: number, c: any) => sum + c.word_count, 0) / topCompetitors.length)
      : 2000;
    const recommendedWordCount = Math.round(avgWordCount * 1.2); // 比平均值多 20%
    
    // 使用 OpenAI 生成更智能的标题和大纲
    const aiGeneratedContent = await this.generateAIOutline(
      keyword,
      contentType,
      topCompetitors,
      relatedQuestions,
      relatedKeywords,
      serpFeatures
    );
    
    // 基于 AI 建议和竞争对手内容创建大纲结构
    const sections = await this.generateOutlineSections(
      keyword,
      topCompetitors,
      relatedQuestions,
      relatedKeywords,
      recommendedWordCount,
      aiGeneratedContent
    );
    
    return {
      title: aiGeneratedContent.title || this.generateTitle(keyword, contentType),
      meta_description: aiGeneratedContent.metaDescription || this.generateMetaDescription(keyword, relatedKeywords),
      target_keyword: keyword,
      word_count: recommendedWordCount,
      sections,
      keywords_to_include: relatedKeywords.slice(0, 15),
      questions_to_answer: relatedQuestions.slice(0, 10),
      competitor_insights: topCompetitors.map(c => ({
        url: c.url,
        title: c.title,
        word_count: c.word_count,
        main_headings: c.headings?.filter((h: any) => h.level <= 2).map((h: any) => h.text)
      }))
    };
  }

  /**
   * 使用 OpenAI 生成智能大纲
   */
  private async generateAIOutline(
    keyword: string,
    contentType: string,
    competitors: any[],
    questions: string[],
    relatedKeywords: string[],
    serpFeatures: any
  ) {
    try {
      const competitorTitles = competitors.map(c => c.title).join('\n');
      const competitorHeadings = competitors
        .flatMap(c => c.headings?.filter((h: any) => h.level <= 2).map((h: any) => h.text) || [])
        .join('\n');

      const prompt = `作为一个SEO内容策略专家，请为关键词"${keyword}"生成一个优化的内容大纲。

内容类型: ${contentType}
相关关键词: ${relatedKeywords.slice(0, 10).join(', ')}
用户常问问题: ${questions.slice(0, 5).join('\n')}

竞争对手标题:
${competitorTitles}

竞争对手主要章节:
${competitorHeadings}

SERP特性: ${JSON.stringify(serpFeatures.features)}

请生成:
1. 一个吸引人且SEO友好的标题（60字符以内）
2. 元描述（155字符以内）
3. 5-7个主要章节标题，每个都应该：
   - 包含相关关键词
   - 解决用户搜索意图
   - 比竞争对手更全面
4. 每个章节下2-3个子标题

格式要求：
{
  "title": "标题",
  "metaDescription": "元描述",
  "sections": [
    {
      "heading": "章节标题",
      "subheadings": ["子标题1", "子标题2"],
      "keywords": ["关键词1", "关键词2"]
    }
  ]
}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "你是一个专业的SEO内容策略师，擅长创建高排名的内容大纲。你的大纲应该超越竞争对手，完全满足用户搜索意图。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
      return aiResponse;
    } catch (error) {
      this.logger.error(`AI 大纲生成失败: ${error.message}`);
      return {
        title: null,
        metaDescription: null,
        sections: []
      };
    }
  }

  /**
   * 生成标题
   */
  private generateTitle(keyword: string, contentType: string): string {
    const templates = {
      blog: [
        `The Ultimate Guide to ${keyword}`,
        `${keyword}: Everything You Need to Know`,
        `How to Master ${keyword} in 2024`,
        `${keyword} Best Practices and Tips`
      ],
      'how-to': [
        `How to ${keyword}: A Step-by-Step Guide`,
        `${keyword} Tutorial: Complete Beginner's Guide`,
        `Master ${keyword} in 10 Easy Steps`
      ],
      comparison: [
        `${keyword}: Complete Comparison and Review`,
        `Best ${keyword} Options Compared`,
        `${keyword} vs Alternatives: Which is Right for You?`
      ]
    };
    
    const typeTemplates = templates[contentType] || templates.blog;
    return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
  }

  /**
   * 生成元描述
   */
  private generateMetaDescription(keyword: string, relatedKeywords: string[]): string {
    const keywordsList = relatedKeywords.slice(0, 3).join(', ');
    return `Discover everything about ${keyword}. Learn about ${keywordsList} and more. Expert tips, comprehensive guide, and practical advice included.`;
  }

  /**
   * 生成大纲章节
   */
  private async generateOutlineSections(
    keyword: string,
    competitors: any[],
    questions: string[],
    relatedKeywords: string[],
    totalWordCount: number,
    aiGeneratedContent?: any
  ): Promise<OutlineSection[]> {
    const sections: OutlineSection[] = [];
    
    // 如果有 AI 生成的内容，优先使用
    if (aiGeneratedContent?.sections?.length > 0) {
      const aiSections = aiGeneratedContent.sections;
      const sectionWordCount = Math.round(totalWordCount * 0.7 / aiSections.length);
      
      aiSections.forEach((aiSection: any, index: number) => {
        sections.push({
          heading: aiSection.heading,
          level: index === 0 ? 1 : 2,
          content_points: [
            'Comprehensive overview and introduction',
            'Key concepts and definitions',
            'Practical examples and case studies',
            'Best practices and expert tips'
          ],
          keywords: aiSection.keywords || relatedKeywords.slice(index * 2, (index + 1) * 2),
          word_count_estimate: sectionWordCount,
          subsections: aiSection.subheadings?.map((subheading: string) => ({
            heading: subheading,
            level: 3,
            content_points: [
              'Detailed explanation',
              'Step-by-step guide',
              'Common mistakes to avoid'
            ],
            keywords: [keyword],
            word_count_estimate: Math.round(sectionWordCount * 0.3)
          }))
        });
      });
    } else {
      // 回退到原始逻辑
      // 1. 引言部分
      sections.push({
        heading: `What is ${keyword}?`,
        level: 1,
        content_points: [
          'Definition and overview',
          'Why it matters',
          'Key benefits',
          'Common misconceptions'
        ],
        keywords: [keyword, ...relatedKeywords.slice(0, 3)],
        word_count_estimate: Math.round(totalWordCount * 0.15)
      });
      
      // 2. 基于竞争对手的常见章节
      const commonSections = this.extractCommonSections(competitors);
      commonSections.forEach((section, index) => {
        sections.push({
          heading: section.heading,
          level: 2,
          content_points: section.points,
          keywords: relatedKeywords.slice(index * 2, (index + 1) * 2),
          word_count_estimate: Math.round(totalWordCount * 0.15),
          subsections: section.subsections?.map(sub => ({
            heading: sub.heading,
            level: 3,
            content_points: sub.points,
            keywords: [keyword],
            word_count_estimate: Math.round(totalWordCount * 0.05)
          }))
        });
      });
    }
    
    // 3. FAQ 部分（基于 People Also Ask）
    if (questions.length > 0) {
      sections.push({
        heading: 'Frequently Asked Questions',
        level: 2,
        content_points: questions.slice(0, 5).map(q => `Answer to: ${q}`),
        keywords: [keyword, 'FAQ', 'questions'],
        word_count_estimate: Math.round(totalWordCount * 0.2),
        subsections: questions.slice(0, 5).map(q => ({
          heading: q,
          level: 3,
          content_points: ['Detailed answer', 'Examples', 'Additional tips'],
          keywords: [keyword],
          word_count_estimate: Math.round(totalWordCount * 0.04)
        }))
      });
    }
    
    // 4. 结论部分
    sections.push({
      heading: 'Conclusion',
      level: 2,
      content_points: [
        'Summary of key points',
        'Final recommendations',
        'Next steps',
        'Additional resources'
      ],
      keywords: [keyword],
      word_count_estimate: Math.round(totalWordCount * 0.1)
    });
    
    return sections;
  }

  /**
   * 提取竞争对手的常见章节
   */
  private extractCommonSections(competitors: any[]): any[] {
    const sectionMap = new Map<string, number>();
    
    // 统计所有标题出现的频率
    competitors.forEach(comp => {
      if (comp.headings) {
        comp.headings
          .filter((h: any) => h.level === 2)
          .forEach((h: any) => {
            const normalized = h.text.toLowerCase().trim();
            sectionMap.set(normalized, (sectionMap.get(normalized) || 0) + 1);
          });
      }
    });
    
    // 选择出现频率最高的章节
    const commonSections = Array.from(sectionMap.entries())
      .filter(([, count]) => count >= 2) // 至少在 2 个竞争对手中出现
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([heading]) => ({
        heading: this.capitalizeHeading(heading),
        points: [
          'Overview and introduction',
          'Key concepts',
          'Best practices',
          'Common mistakes to avoid'
        ]
      }));
    
    return commonSections;
  }

  /**
   * 标题格式化
   */
  private capitalizeHeading(heading: string): string {
    return heading
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}