import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
const SerpApi = require('serpapi');

@Injectable()
export class GoogleApisService {
  private readonly logger = new Logger(GoogleApisService.name);
  private searchConsole: any;
  private serpApi: any;
  private oauth2Client: OAuth2Client;

  constructor(private configService: ConfigService) {
    this.initializeApis();
  }

  private initializeApis() {
    // 初始化 SerpApi
    const serpApiKey = this.configService.get<string>('SERPAPI_KEY');
    this.serpApi = new SerpApi.GoogleSearch(serpApiKey);

    // 初始化 Google OAuth2 客户端
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      'http://localhost:4000/auth/google/callback'
    );

    // 设置 API Key 认证（用于不需要 OAuth 的 API）
    const apiKey = this.configService.get<string>('GOOGLE_SEARCH_CONSOLE_API_KEY');
    google.options({ auth: apiKey });
  }

  /**
   * 搜索关键词数据（使用 SerpApi）
   */
  async searchKeywordData(keyword: string, location: string = 'United States') {
    try {
      const params = {
        q: keyword,
        location: location,
        hl: 'en',
        gl: 'us',
        google_domain: 'google.com',
        num: 100,
        device: 'desktop'
      };

      return new Promise((resolve, reject) => {
        this.serpApi.json(params, (data: any) => {
          if (data.error) {
            reject(data.error);
          } else {
            resolve(this.parseSearchResults(data));
          }
        });
      });
    } catch (error) {
      this.logger.error(`搜索关键词失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 解析搜索结果
   */
  private parseSearchResults(data: any) {
    const results = {
      keyword: data.search_parameters?.q,
      total_results: data.search_information?.total_results,
      search_time: data.search_information?.time_taken_displayed,
      organic_results: [],
      people_also_ask: [],
      related_searches: [],
      featured_snippet: null,
      knowledge_graph: null,
      local_pack: [],
      ads: []
    };

    // 解析自然搜索结果
    if (data.organic_results) {
      results.organic_results = data.organic_results.map((result: any) => ({
        position: result.position,
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        domain: new URL(result.link).hostname,
        cached_page_link: result.cached_page_link
      }));
    }

    // 解析 People Also Ask
    if (data.related_questions) {
      results.people_also_ask = data.related_questions.map((q: any) => ({
        question: q.question,
        snippet: q.snippet,
        title: q.title,
        link: q.link
      }));
    }

    // 解析相关搜索
    if (data.related_searches) {
      results.related_searches = data.related_searches.map((s: any) => ({
        query: s.query,
        link: s.link
      }));
    }

    // 解析精选摘要
    if (data.answer_box) {
      results.featured_snippet = {
        title: data.answer_box.title,
        snippet: data.answer_box.snippet || data.answer_box.answer,
        link: data.answer_box.link
      };
    }

    // 解析知识图谱
    if (data.knowledge_graph) {
      results.knowledge_graph = {
        title: data.knowledge_graph.title,
        type: data.knowledge_graph.type,
        description: data.knowledge_graph.description,
        source: data.knowledge_graph.source,
        attributes: data.knowledge_graph.attributes
      };
    }

    // 解析本地结果
    if (data.local_results?.places) {
      results.local_pack = data.local_results.places.map((place: any) => ({
        position: place.position,
        title: place.title,
        address: place.address,
        rating: place.rating,
        reviews: place.reviews,
        type: place.type
      }));
    }

    // 解析广告
    if (data.ads) {
      results.ads = data.ads.map((ad: any) => ({
        position: ad.position,
        title: ad.title,
        link: ad.link,
        displayed_link: ad.displayed_link,
        description: ad.description
      }));
    }

    return results;
  }

  /**
   * 获取关键词搜索量趋势（使用 Google Trends 非官方 API）
   */
  async getKeywordTrends(keywords: string[], timeRange: string = 'today 12-m') {
    try {
      // 这里使用 SerpApi 的 Google Trends 功能
      const params = {
        engine: 'google_trends',
        q: keywords.join(','),
        date: timeRange,
        geo: 'US'
      };

      return new Promise((resolve, reject) => {
        const trendsApi = new SerpApi.GoogleSearch(this.configService.get<string>('SERPAPI_KEY'));
        trendsApi.json(params, (data: any) => {
          if (data.error) {
            reject(data.error);
          } else {
            resolve(this.parseTrendsData(data));
          }
        });
      });
    } catch (error) {
      this.logger.error(`获取关键词趋势失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 解析趋势数据
   */
  private parseTrendsData(data: any) {
    return {
      keywords: data.compared_breakdown_by_region?.[0]?.keyword_name || [],
      interest_over_time: data.interest_over_time?.timeline_data?.map((item: any) => ({
        date: item.date,
        values: item.values?.map((v: any, index: number) => ({
          keyword: data.compared_breakdown_by_region?.[index]?.keyword_name,
          value: v.value,
          extracted_value: v.extracted_value
        }))
      })),
      interest_by_region: data.interest_by_region?.map((region: any) => ({
        location: region.location,
        values: region.keyword_popularity
      })),
      related_queries: data.related_queries,
      related_topics: data.related_topics
    };
  }

  /**
   * 获取竞争对手分析
   */
  async getCompetitorAnalysis(domain: string) {
    try {
      // 使用 SerpApi 获取域名相关信息
      const params = {
        engine: 'google',
        q: `site:${domain}`,
        num: 100
      };

      const domainResults = await new Promise((resolve, reject) => {
        this.serpApi.json(params, (data: any) => {
          if (data.error) {
            reject(data.error);
          } else {
            resolve(data);
          }
        });
      });

      // 获取竞争对手的反向链接
      const backlinksParams = {
        engine: 'google',
        q: `link:${domain} -site:${domain}`,
        num: 50
      };

      const backlinksData = await new Promise((resolve, reject) => {
        this.serpApi.json(backlinksParams, (data: any) => {
          if (data.error) {
            reject(data.error);
          } else {
            resolve(data);
          }
        });
      });

      return {
        domain: domain,
        indexed_pages: domainResults['search_information']?.total_results || 0,
        top_pages: domainResults['organic_results']?.slice(0, 10).map((r: any) => ({
          title: r.title,
          link: r.link,
          snippet: r.snippet
        })),
        backlinks: {
          total_backlinks: backlinksData['search_information']?.total_results || 0,
          top_referring_domains: backlinksData['organic_results']?.slice(0, 20).map((r: any) => ({
            domain: new URL(r.link).hostname,
            link: r.link,
            title: r.title
          }))
        }
      };
    } catch (error) {
      this.logger.error(`获取竞争对手分析失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取 SERP 特性分析
   */
  async analyzeSerpFeatures(keyword: string) {
    try {
      const searchData: any = await this.searchKeywordData(keyword);
      
      const features = {
        has_featured_snippet: !!searchData.featured_snippet,
        has_people_also_ask: searchData.people_also_ask?.length > 0,
        has_knowledge_graph: !!searchData.knowledge_graph,
        has_local_pack: searchData.local_pack?.length > 0,
        has_ads: searchData.ads?.length > 0,
        ads_count: searchData.ads?.length || 0,
        organic_results_count: searchData.organic_results?.length || 0,
        people_also_ask_count: searchData.people_also_ask?.length || 0,
        related_searches_count: searchData.related_searches?.length || 0
      };

      return {
        keyword,
        features,
        serp_data: searchData
      };
    } catch (error) {
      this.logger.error(`分析 SERP 特性失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量获取关键词数据
   */
  async batchGetKeywordData(keywords: string[]) {
    const results = [];
    
    for (const keyword of keywords) {
      try {
        const data = await this.searchKeywordData(keyword);
        const serpFeatures = await this.analyzeSerpFeatures(keyword);
        
        results.push({
          keyword,
          success: true,
          data: {
            search_data: data,
            serp_features: serpFeatures.features
          }
        });
      } catch (error) {
        results.push({
          keyword,
          success: false,
          error: error.message
        });
      }
      
      // 添加延迟避免速率限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * 获取位置相关的搜索数据
   */
  async getLocalSearchData(keyword: string, location: string, language: string = 'en') {
    try {
      const params = {
        q: keyword,
        location: location,
        hl: language,
        gl: language === 'en' ? 'us' : language,
        google_domain: 'google.com',
        num: 20,
        device: 'desktop'
      };

      return new Promise((resolve, reject) => {
        this.serpApi.json(params, (data: any) => {
          if (data.error) {
            reject(data.error);
          } else {
            resolve({
              location: location,
              language: language,
              results: this.parseSearchResults(data)
            });
          }
        });
      });
    } catch (error) {
      this.logger.error(`获取本地搜索数据失败: ${error.message}`);
      throw error;
    }
  }
}