import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Entity {
  id: string;
  type: 'product' | 'feature' | 'concept' | 'brand' | 'category' | 'problem' | 'solution';
  name: string;
  aliases: string[];
  attributes: Map<string, any>;
  embedding?: number[];
  importance: number;
  lastUpdated: Date;
}

export interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  strength: number;
  properties: Map<string, any>;
  bidirectional: boolean;
  context: string[];
}

export type RelationshipType = 
  | 'is_a'          // 继承关系
  | 'part_of'       // 组成关系
  | 'related_to'    // 相关关系
  | 'solves'        // 解决关系
  | 'requires'      // 依赖关系
  | 'competes_with' // 竞争关系
  | 'replaces'      // 替代关系
  | 'enhances'      // 增强关系
  | 'caused_by'     // 因果关系
  | 'similar_to';   // 相似关系

export interface KnowledgeGraph {
  graphId: string;
  name: string;
  domain: string;
  entities: Map<string, Entity>;
  relationships: Map<string, Relationship>;
  metadata: GraphMetadata;
  statistics: GraphStatistics;
}

export interface GraphMetadata {
  version: number;
  created: Date;
  lastModified: Date;
  source: string[];
  language: string[];
  coverage: string;
}

export interface GraphStatistics {
  totalEntities: number;
  totalRelationships: number;
  avgDegree: number;
  density: number;
  clusters: number;
  mainComponents: EntityCluster[];
}

export interface EntityCluster {
  clusterId: string;
  name: string;
  entities: string[];
  centralEntity: string;
  theme: string;
  coherence: number;
}

export interface QueryContext {
  query: string;
  intent: string;
  entities: string[];
  constraints: QueryConstraint[];
  expansionDepth: number;
  resultLimit: number;
}

export interface QueryConstraint {
  type: 'entity_type' | 'relationship_type' | 'attribute' | 'distance';
  value: any;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
}

export interface GraphQuery {
  startNodes: string[];
  traversalPattern: TraversalPattern;
  filters: QueryConstraint[];
  aggregations: AggregationType[];
  returnFormat: 'nodes' | 'paths' | 'subgraph' | 'summary';
}

export interface TraversalPattern {
  direction: 'outgoing' | 'incoming' | 'both';
  relationshipTypes: RelationshipType[];
  minDepth: number;
  maxDepth: number;
  pathStrategy: 'shortest' | 'all' | 'weighted';
}

export type AggregationType = 
  | 'count'
  | 'group_by'
  | 'avg_weight'
  | 'centrality'
  | 'clustering_coefficient';

export interface GraphInsight {
  insightType: 'pattern' | 'anomaly' | 'trend' | 'recommendation' | 'gap';
  title: string;
  description: string;
  entities: string[];
  relationships: string[];
  confidence: number;
  actionableSteps: string[];
  impact: 'low' | 'medium' | 'high';
}

export interface ContentEnrichment {
  contentId: string;
  extractedEntities: Entity[];
  inferredRelationships: Relationship[];
  relatedConcepts: ConceptRecommendation[];
  knowledgeGaps: KnowledgeGap[];
  enrichmentScore: number;
}

export interface ConceptRecommendation {
  concept: string;
  relevance: number;
  reasoning: string;
  sourcePaths: string[][];
  contentSuggestions: string[];
}

export interface KnowledgeGap {
  gapType: 'missing_entity' | 'weak_connection' | 'outdated_info' | 'ambiguity';
  description: string;
  affectedEntities: string[];
  suggestedActions: string[];
  priority: number;
}

@Injectable()
export class SemanticKnowledgeGraphService {
  private knowledgeGraphs = new Map<string, KnowledgeGraph>();
  private entityIndex = new Map<string, Set<string>>(); // entity name -> graph IDs
  private semanticCache = new Map<string, any>();

  constructor(private configService: ConfigService) {
    this.initializeKnowledgeGraphs();
  }

  /**
   * 核心：构建语义知识图谱
   */
  async buildKnowledgeGraph(
    domain: string,
    sources: {
      documents: string[];
      existingData?: any;
      externalAPIs?: string[];
    }
  ): Promise<KnowledgeGraph> {
    console.log(`🧠 构建语义知识图谱: ${domain}`);

    // 1. 初始化图谱
    const graph = this.initializeGraph(domain);

    // 2. 提取实体
    const entities = await this.extractEntities(sources.documents);
    
    // 3. 识别关系
    const relationships = await this.identifyRelationships(entities, sources.documents);

    // 4. 实体消歧和合并
    const disambiguatedEntities = await this.disambiguateEntities(entities);

    // 5. 关系验证和权重计算
    const validatedRelationships = await this.validateRelationships(
      relationships,
      disambiguatedEntities
    );

    // 6. 计算实体重要性
    await this.calculateEntityImportance(disambiguatedEntities, validatedRelationships);

    // 7. 生成嵌入向量
    await this.generateEmbeddings(disambiguatedEntities);

    // 8. 聚类分析
    const clusters = await this.performClustering(disambiguatedEntities, validatedRelationships);

    // 9. 构建最终图谱
    graph.entities = new Map(disambiguatedEntities.map(e => [e.id, e]));
    graph.relationships = new Map(validatedRelationships.map(r => [r.id, r]));
    graph.statistics = await this.calculateGraphStatistics(graph, clusters);

    // 10. 存储和索引
    this.knowledgeGraphs.set(graph.graphId, graph);
    this.indexGraph(graph);

    return graph;
  }

  /**
   * 查询知识图谱
   */
  async queryGraph(graphId: string, query: GraphQuery): Promise<{
    results: any;
    paths: any[];
    insights: GraphInsight[];
    performance: {
      queryTime: number;
      nodesVisited: number;
      pathsExplored: number;
    };
  }> {
    const startTime = Date.now();
    const graph = this.knowledgeGraphs.get(graphId);
    
    if (!graph) {
      throw new Error(`知识图谱不存在: ${graphId}`);
    }

    console.log(`🔍 查询知识图谱: ${query.startNodes.join(', ')}`);

    // 1. 执行图遍历
    const traversalResult = await this.performTraversal(graph, query);

    // 2. 应用过滤器
    const filteredResult = this.applyFilters(traversalResult, query.filters);

    // 3. 执行聚合
    const aggregatedResult = await this.performAggregations(
      filteredResult,
      query.aggregations
    );

    // 4. 格式化结果
    const formattedResult = this.formatQueryResult(
      aggregatedResult,
      query.returnFormat
    );

    // 5. 生成洞察
    const insights = await this.generateQueryInsights(
      graph,
      query,
      formattedResult
    );

    return {
      results: formattedResult,
      paths: traversalResult.paths || [],
      insights,
      performance: {
        queryTime: Date.now() - startTime,
        nodesVisited: traversalResult.nodesVisited || 0,
        pathsExplored: traversalResult.pathsExplored || 0
      }
    };
  }

  /**
   * 基于内容的知识图谱查询
   */
  async queryByContent(
    graphId: string,
    content: string,
    context?: QueryContext
  ): Promise<{
    relevantEntities: Entity[];
    relatedConcepts: any[];
    suggestedQueries: string[];
    knowledgePaths: any[];
  }> {
    const graph = this.knowledgeGraphs.get(graphId);
    if (!graph) {
      throw new Error(`知识图谱不存在: ${graphId}`);
    }

    // 1. 从内容提取实体和概念
    const extractedInfo = await this.extractContentInfo(content);

    // 2. 在图谱中查找相关实体
    const relevantEntities = await this.findRelevantEntities(
      graph,
      extractedInfo,
      context
    );

    // 3. 发现相关概念
    const relatedConcepts = await this.discoverRelatedConcepts(
      graph,
      relevantEntities
    );

    // 4. 构建知识路径
    const knowledgePaths = await this.buildKnowledgePaths(
      graph,
      relevantEntities
    );

    // 5. 生成查询建议
    const suggestedQueries = this.generateQuerySuggestions(
      relevantEntities,
      relatedConcepts,
      context
    );

    return {
      relevantEntities,
      relatedConcepts,
      suggestedQueries,
      knowledgePaths
    };
  }

  /**
   * 内容增强
   */
  async enrichContent(
    graphId: string,
    content: {
      id: string;
      text: string;
      currentEntities?: string[];
    }
  ): Promise<ContentEnrichment> {
    const graph = this.knowledgeGraphs.get(graphId);
    if (!graph) {
      throw new Error(`知识图谱不存在: ${graphId}`);
    }

    console.log(`✨ 增强内容: ${content.id}`);

    // 1. 提取内容中的实体
    const extractedEntities = await this.extractContentEntities(content.text, graph);

    // 2. 推断潜在关系
    const inferredRelationships = await this.inferRelationships(
      extractedEntities,
      graph
    );

    // 3. 发现相关概念
    const relatedConcepts = await this.recommendRelatedConcepts(
      extractedEntities,
      graph
    );

    // 4. 识别知识缺口
    const knowledgeGaps = await this.identifyKnowledgeGaps(
      content,
      extractedEntities,
      graph
    );

    // 5. 计算增强分数
    const enrichmentScore = this.calculateEnrichmentScore(
      extractedEntities,
      inferredRelationships,
      relatedConcepts
    );

    return {
      contentId: content.id,
      extractedEntities,
      inferredRelationships,
      relatedConcepts,
      knowledgeGaps,
      enrichmentScore
    };
  }

  /**
   * 更新知识图谱
   */
  async updateGraph(
    graphId: string,
    updates: {
      newEntities?: Entity[];
      newRelationships?: Relationship[];
      entityUpdates?: Map<string, Partial<Entity>>;
      relationshipUpdates?: Map<string, Partial<Relationship>>;
    }
  ): Promise<{
    updated: boolean;
    changes: {
      entitiesAdded: number;
      entitiesUpdated: number;
      relationshipsAdded: number;
      relationshipsUpdated: number;
    };
    conflicts: any[];
    newInsights: GraphInsight[];
  }> {
    const graph = this.knowledgeGraphs.get(graphId);
    if (!graph) {
      throw new Error(`知识图谱不存在: ${graphId}`);
    }

    console.log(`🔄 更新知识图谱: ${graphId}`);

    const changes = {
      entitiesAdded: 0,
      entitiesUpdated: 0,
      relationshipsAdded: 0,
      relationshipsUpdated: 0
    };
    const conflicts = [];

    // 1. 添加新实体
    if (updates.newEntities) {
      for (const entity of updates.newEntities) {
        if (!graph.entities.has(entity.id)) {
          graph.entities.set(entity.id, entity);
          changes.entitiesAdded++;
        } else {
          conflicts.push({
            type: 'entity_exists',
            id: entity.id,
            existing: graph.entities.get(entity.id)
          });
        }
      }
    }

    // 2. 更新现有实体
    if (updates.entityUpdates) {
      for (const [entityId, update] of updates.entityUpdates) {
        const entity = graph.entities.get(entityId);
        if (entity) {
          Object.assign(entity, update, { lastUpdated: new Date() });
          changes.entitiesUpdated++;
        }
      }
    }

    // 3. 添加新关系
    if (updates.newRelationships) {
      for (const relationship of updates.newRelationships) {
        if (this.validateRelationshipNodes(relationship, graph)) {
          graph.relationships.set(relationship.id, relationship);
          changes.relationshipsAdded++;
        } else {
          conflicts.push({
            type: 'invalid_relationship_nodes',
            relationship
          });
        }
      }
    }

    // 4. 更新现有关系
    if (updates.relationshipUpdates) {
      for (const [relId, update] of updates.relationshipUpdates) {
        const relationship = graph.relationships.get(relId);
        if (relationship) {
          Object.assign(relationship, update);
          changes.relationshipsUpdated++;
        }
      }
    }

    // 5. 重新计算统计信息
    const clusters = await this.performClustering(
      Array.from(graph.entities.values()),
      Array.from(graph.relationships.values())
    );
    graph.statistics = await this.calculateGraphStatistics(graph, clusters);

    // 6. 生成新洞察
    const newInsights = await this.detectGraphChanges(graph, changes);

    // 7. 更新元数据
    graph.metadata.lastModified = new Date();
    graph.metadata.version++;

    return {
      updated: true,
      changes,
      conflicts,
      newInsights
    };
  }

  /**
   * 发现知识图谱洞察
   */
  async discoverInsights(graphId: string): Promise<GraphInsight[]> {
    const graph = this.knowledgeGraphs.get(graphId);
    if (!graph) {
      throw new Error(`知识图谱不存在: ${graphId}`);
    }

    console.log(`💡 发现知识图谱洞察...`);

    const insights: GraphInsight[] = [];

    // 1. 模式发现
    const patterns = await this.discoverPatterns(graph);
    insights.push(...patterns);

    // 2. 异常检测
    const anomalies = await this.detectAnomalies(graph);
    insights.push(...anomalies);

    // 3. 趋势分析
    const trends = await this.analyzeTrends(graph);
    insights.push(...trends);

    // 4. 推荐生成
    const recommendations = await this.generateRecommendations(graph);
    insights.push(...recommendations);

    // 5. 知识缺口识别
    const gaps = await this.identifyGraphGaps(graph);
    insights.push(...gaps);

    return insights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  // 私有方法实现

  private initializeGraph(domain: string): KnowledgeGraph {
    return {
      graphId: `kg_${domain}_${Date.now()}`,
      name: `${domain} Knowledge Graph`,
      domain,
      entities: new Map(),
      relationships: new Map(),
      metadata: {
        version: 1,
        created: new Date(),
        lastModified: new Date(),
        source: [],
        language: ['zh', 'en'],
        coverage: 'comprehensive'
      },
      statistics: {
        totalEntities: 0,
        totalRelationships: 0,
        avgDegree: 0,
        density: 0,
        clusters: 0,
        mainComponents: []
      }
    };
  }

  private async extractEntities(documents: string[]): Promise<Entity[]> {
    // 模拟实体提取
    const entities: Entity[] = [];
    
    // 示例：Eufy产品相关实体
    entities.push(
      {
        id: 'entity_eufy_cam3',
        type: 'product',
        name: 'EufyCam 3',
        aliases: ['Eufy Camera 3', 'Eufy安防摄像头3代'],
        attributes: new Map([
          ['category', '智能安防'],
          ['resolution', '4K'],
          ['features', ['AI检测', '本地存储', '太阳能充电']]
        ]),
        importance: 0.9,
        lastUpdated: new Date()
      },
      {
        id: 'entity_ai_detection',
        type: 'feature',
        name: 'AI人形检测',
        aliases: ['AI Detection', '人工智能检测'],
        attributes: new Map([
          ['accuracy', 0.95],
          ['supportedObjects', ['人', '车辆', '动物', '包裹']]
        ]),
        importance: 0.85,
        lastUpdated: new Date()
      }
    );

    return entities;
  }

  private async identifyRelationships(
    entities: Entity[],
    documents: string[]
  ): Promise<Relationship[]> {
    const relationships: Relationship[] = [];

    // 示例关系
    relationships.push({
      id: 'rel_001',
      type: 'part_of',
      sourceId: 'entity_ai_detection',
      targetId: 'entity_eufy_cam3',
      strength: 0.9,
      properties: new Map([['essential', true]]),
      bidirectional: false,
      context: ['产品功能', '核心特性']
    });

    return relationships;
  }

  private async disambiguateEntities(entities: Entity[]): Promise<Entity[]> {
    // 实体消歧逻辑
    const uniqueEntities = new Map<string, Entity>();
    
    for (const entity of entities) {
      const key = `${entity.type}_${entity.name.toLowerCase()}`;
      if (!uniqueEntities.has(key)) {
        uniqueEntities.set(key, entity);
      } else {
        // 合并别名和属性
        const existing = uniqueEntities.get(key)!;
        existing.aliases = [...new Set([...existing.aliases, ...entity.aliases])];
        // 合并属性逻辑
      }
    }

    return Array.from(uniqueEntities.values());
  }

  private async validateRelationships(
    relationships: Relationship[],
    entities: Entity[]
  ): Promise<Relationship[]> {
    const entityIds = new Set(entities.map(e => e.id));
    
    return relationships.filter(rel => 
      entityIds.has(rel.sourceId) && entityIds.has(rel.targetId)
    );
  }

  private async calculateEntityImportance(
    entities: Entity[],
    relationships: Relationship[]
  ): Promise<void> {
    // PageRank风格的重要性计算
    const incomingEdges = new Map<string, number>();
    const outgoingEdges = new Map<string, number>();

    for (const rel of relationships) {
      incomingEdges.set(rel.targetId, (incomingEdges.get(rel.targetId) || 0) + rel.strength);
      outgoingEdges.set(rel.sourceId, (outgoingEdges.get(rel.sourceId) || 0) + 1);
    }

    for (const entity of entities) {
      const incoming = incomingEdges.get(entity.id) || 0;
      const outgoing = outgoingEdges.get(entity.id) || 0;
      entity.importance = (incoming * 0.7 + outgoing * 0.3) / (entities.length * 0.5);
      entity.importance = Math.min(entity.importance, 1.0);
    }
  }

  private async generateEmbeddings(entities: Entity[]): Promise<void> {
    // 模拟嵌入向量生成
    for (const entity of entities) {
      entity.embedding = Array(128).fill(0).map(() => Math.random());
    }
  }

  private async performClustering(
    entities: Entity[],
    relationships: Relationship[]
  ): Promise<EntityCluster[]> {
    // 简化的聚类实现
    const clusters: EntityCluster[] = [
      {
        clusterId: 'cluster_security',
        name: '安防设备集群',
        entities: entities.filter(e => e.type === 'product').map(e => e.id),
        centralEntity: 'entity_eufy_cam3',
        theme: '智能家居安防',
        coherence: 0.85
      }
    ];

    return clusters;
  }

  private async calculateGraphStatistics(
    graph: KnowledgeGraph,
    clusters: EntityCluster[]
  ): Promise<GraphStatistics> {
    const totalEntities = graph.entities.size;
    const totalRelationships = graph.relationships.size;
    const avgDegree = totalEntities > 0 ? (totalRelationships * 2) / totalEntities : 0;
    const maxPossibleEdges = (totalEntities * (totalEntities - 1)) / 2;
    const density = maxPossibleEdges > 0 ? totalRelationships / maxPossibleEdges : 0;

    return {
      totalEntities,
      totalRelationships,
      avgDegree,
      density,
      clusters: clusters.length,
      mainComponents: clusters
    };
  }

  private indexGraph(graph: KnowledgeGraph): void {
    // 为实体名称建立索引
    for (const entity of graph.entities.values()) {
      const names = [entity.name, ...entity.aliases];
      for (const name of names) {
        const key = name.toLowerCase();
        if (!this.entityIndex.has(key)) {
          this.entityIndex.set(key, new Set());
        }
        this.entityIndex.get(key)!.add(graph.graphId);
      }
    }
  }

  private async performTraversal(
    graph: KnowledgeGraph,
    query: GraphQuery
  ): Promise<any> {
    // 图遍历实现
    const visited = new Set<string>();
    const paths = [];
    let nodesVisited = 0;
    let pathsExplored = 0;

    // BFS或DFS遍历逻辑
    // ...

    return {
      nodes: Array.from(visited).map(id => graph.entities.get(id)),
      paths,
      nodesVisited,
      pathsExplored
    };
  }

  private applyFilters(result: any, filters: QueryConstraint[]): any {
    // 应用查询过滤器
    return result;
  }

  private async performAggregations(result: any, aggregations: AggregationType[]): Promise<any> {
    // 执行聚合操作
    return result;
  }

  private formatQueryResult(result: any, format: string): any {
    // 格式化查询结果
    return result;
  }

  private async generateQueryInsights(
    graph: KnowledgeGraph,
    query: GraphQuery,
    result: any
  ): Promise<GraphInsight[]> {
    // 基于查询结果生成洞察
    return [];
  }

  private async extractContentInfo(content: string): Promise<any> {
    // 从内容中提取信息
    return {
      entities: [],
      concepts: [],
      keywords: []
    };
  }

  private async findRelevantEntities(
    graph: KnowledgeGraph,
    extractedInfo: any,
    context?: QueryContext
  ): Promise<Entity[]> {
    // 查找相关实体
    return [];
  }

  private async discoverRelatedConcepts(
    graph: KnowledgeGraph,
    entities: Entity[]
  ): Promise<any[]> {
    // 发现相关概念
    return [];
  }

  private async buildKnowledgePaths(
    graph: KnowledgeGraph,
    entities: Entity[]
  ): Promise<any[]> {
    // 构建知识路径
    return [];
  }

  private generateQuerySuggestions(
    entities: Entity[],
    concepts: any[],
    context?: QueryContext
  ): string[] {
    // 生成查询建议
    return [
      `${entities[0]?.name} 的主要特点是什么？`,
      `如何设置 ${entities[0]?.name}？`,
      `${entities[0]?.name} vs 竞品对比`
    ];
  }

  private async extractContentEntities(
    text: string,
    graph: KnowledgeGraph
  ): Promise<Entity[]> {
    // 从内容中提取实体
    return [];
  }

  private async inferRelationships(
    entities: Entity[],
    graph: KnowledgeGraph
  ): Promise<Relationship[]> {
    // 推断关系
    return [];
  }

  private async recommendRelatedConcepts(
    entities: Entity[],
    graph: KnowledgeGraph
  ): Promise<ConceptRecommendation[]> {
    // 推荐相关概念
    return [];
  }

  private async identifyKnowledgeGaps(
    content: any,
    entities: Entity[],
    graph: KnowledgeGraph
  ): Promise<KnowledgeGap[]> {
    // 识别知识缺口
    return [];
  }

  private calculateEnrichmentScore(
    entities: Entity[],
    relationships: Relationship[],
    concepts: ConceptRecommendation[]
  ): number {
    // 计算增强分数
    const entityScore = entities.length * 0.3;
    const relationshipScore = relationships.length * 0.4;
    const conceptScore = concepts.length * 0.3;
    
    return Math.min((entityScore + relationshipScore + conceptScore) / 10, 1.0);
  }

  private validateRelationshipNodes(
    relationship: Relationship,
    graph: KnowledgeGraph
  ): boolean {
    return graph.entities.has(relationship.sourceId) && 
           graph.entities.has(relationship.targetId);
  }

  private async detectGraphChanges(
    graph: KnowledgeGraph,
    changes: any
  ): Promise<GraphInsight[]> {
    // 检测图谱变化并生成洞察
    return [];
  }

  private async discoverPatterns(graph: KnowledgeGraph): Promise<GraphInsight[]> {
    // 发现图谱模式
    return [];
  }

  private async detectAnomalies(graph: KnowledgeGraph): Promise<GraphInsight[]> {
    // 检测异常
    return [];
  }

  private async analyzeTrends(graph: KnowledgeGraph): Promise<GraphInsight[]> {
    // 分析趋势
    return [];
  }

  private async generateRecommendations(graph: KnowledgeGraph): Promise<GraphInsight[]> {
    // 生成推荐
    return [];
  }

  private async identifyGraphGaps(graph: KnowledgeGraph): Promise<GraphInsight[]> {
    // 识别图谱缺口
    return [];
  }

  private initializeKnowledgeGraphs(): void {
    console.log('🌐 初始化语义知识图谱系统...');
  }

  /**
   * 获取图谱统计信息
   */
  async getGraphStats(graphId?: string): Promise<{
    totalGraphs: number;
    totalEntities: number;
    totalRelationships: number;
    domains: string[];
    insights: {
      mostConnectedEntities: any[];
      keyRelationshipTypes: any[];
      knowledgeDensity: number;
    };
  }> {
    if (graphId) {
      const graph = this.knowledgeGraphs.get(graphId);
      if (!graph) {
        throw new Error(`知识图谱不存在: ${graphId}`);
      }
      
      return {
        totalGraphs: 1,
        totalEntities: graph.statistics.totalEntities,
        totalRelationships: graph.statistics.totalRelationships,
        domains: [graph.domain],
        insights: {
          mostConnectedEntities: [],
          keyRelationshipTypes: [],
          knowledgeDensity: graph.statistics.density
        }
      };
    }

    // 全局统计
    let totalEntities = 0;
    let totalRelationships = 0;
    const domains = new Set<string>();

    for (const graph of this.knowledgeGraphs.values()) {
      totalEntities += graph.statistics.totalEntities;
      totalRelationships += graph.statistics.totalRelationships;
      domains.add(graph.domain);
    }

    return {
      totalGraphs: this.knowledgeGraphs.size,
      totalEntities,
      totalRelationships,
      domains: Array.from(domains),
      insights: {
        mostConnectedEntities: [],
        keyRelationshipTypes: [],
        knowledgeDensity: this.knowledgeGraphs.size > 0 
          ? totalRelationships / (totalEntities * this.knowledgeGraphs.size)
          : 0
      }
    };
  }
}