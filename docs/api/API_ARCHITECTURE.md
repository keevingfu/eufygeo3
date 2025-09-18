# GEO 平台 API 架构设计

## 1. API 总体设计原则

### 1.1 架构风格
- **主要接口**: GraphQL (复杂查询、实时订阅)
- **辅助接口**: REST (文件上传、第三方集成)
- **实时通信**: WebSocket (协作编辑、实时通知)

### 1.2 设计原则
- **Schema-First**: GraphQL Schema 定义优先
- **类型安全**: TypeScript 全栈类型共享
- **模块化**: 按业务领域划分模块
- **性能优先**: DataLoader 批量加载、查询优化
- **安全第一**: 认证、授权、限流、审计

## 2. GraphQL Schema 设计

### 2.1 核心类型定义

```graphql
# ==================== 基础类型 ====================

scalar DateTime
scalar UUID
scalar JSON

enum Role {
  ADMIN
  MANAGER
  STRATEGIST
  CREATOR
  OPERATOR
}

enum KeywordPriority {
  P0
  P1
  P2
  P3
  P4
}

enum AIOStatus {
  YES
  NO
  MONITORING
  NOT_MONITORED
}

enum ContentStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  PUBLISHED
  ARCHIVED
}

# ==================== 用户类型 ====================

type User {
  id: UUID!
  email: String!
  username: String!
  fullName: String
  avatarUrl: String
  role: Role!
  department: String
  isActive: Boolean!
  lastLoginAt: DateTime
  createdAt: DateTime!
  
  # 关联数据
  assignedKeywords: [Keyword!]!
  assignedContent: [ContentItem!]!
  tasks: [Task!]!
}

# ==================== 关键词类型 ====================

type Keyword {
  id: UUID!
  text: String!
  searchVolume: Int
  difficulty: Float
  cpc: Float
  competitionLevel: String
  priority: KeywordPriority
  intentType: String
  productLine: String
  stage: String
  
  # AIO 状态
  aioStatus: AIOStatus!
  aioFirstSeenAt: DateTime
  aioCoverageScore: Float
  
  # 状态
  status: String!
  assignee: User
  creator: User!
  
  # 关联数据
  metrics: [KeywordMetric!]!
  latestMetric: KeywordMetric
  contentItems: [ContentItem!]!
  tasks: [Task!]!
  
  # 计算字段
  trendDirection: String!
  competitorCount: Int!
  opportunityScore: Float!
}

type KeywordMetric {
  id: UUID!
  keyword: Keyword!
  metricDate: DateTime!
  
  # 排名数据
  googlePosition: Int
  googleFeaturedSnippet: Boolean!
  googlePeopleAlsoAsk: Boolean!
  
  # AIO 数据
  aioDisplayed: Boolean!
  aioPosition: Int
  aioContentSnippet: String
  
  # 流量数据
  organicTraffic: Int
  organicCtr: Float
  
  # 竞争数据
  topCompetitors: [CompetitorData!]!
}

type CompetitorData {
  domain: String!
  position: Int!
  trafficShare: Float!
}

# ==================== 内容类型 ====================

type ContentItem {
  id: UUID!
  title: String!
  slug: String!
  contentType: String!
  channel: String!
  
  # 内容详情
  brief: String
  content: String
  metaDescription: String
  
  # AI 辅助
  aiSuggestions: JSON
  aiScore: Float
  optimizationChecklist: JSON
  
  # 工作流
  status: ContentStatus!
  workflowStage: String
  assignee: User
  reviewer: User
  approver: User
  approvedAt: DateTime
  
  # 发布信息
  publishedAt: DateTime
  publishedUrl: String
  externalId: String
  
  # 关联数据
  keywords: [Keyword!]!
  versions: [ContentVersion!]!
  tasks: [Task!]!
  analytics: ContentAnalytics
}

type ContentAnalytics {
  views: Int!
  avgTimeOnPage: Float!
  bounceRate: Float!
  conversionRate: Float!
  aioAppearances: Int!
}

# ==================== 分析类型 ====================

type PerformanceMetrics {
  aioCoverage: Float!
  organicTraffic: Int!
  conversionRate: Float!
  roi: Float!
  
  # 趋势数据
  aioCoverageChange: Float!
  trafficChange: Float!
  roiChange: Float!
}

type DashboardData {
  # 核心 KPI
  metrics: PerformanceMetrics!
  
  # 关键词数据
  keywordsByPriority: [KeywordPriorityData!]!
  keywordOpportunities: [Keyword!]!
  
  # 内容数据
  contentByStatus: [ContentStatusData!]!
  upcomingContent: [ContentItem!]!
  
  # 竞争分析
  competitorAnalysis: [CompetitorAnalysis!]!
  
  # 渠道表现
  channelPerformance: [ChannelPerformance!]!
}

# ==================== 输入类型 ====================

input KeywordCreateInput {
  text: String!
  searchVolume: Int
  difficulty: Float
  cpc: Float
  priority: KeywordPriority!
  intentType: String
  productLine: String
  assigneeId: UUID
}

input KeywordFilterInput {
  text: String
  priority: [KeywordPriority!]
  aioStatus: [AIOStatus!]
  minSearchVolume: Int
  maxDifficulty: Float
  productLine: [String!]
  assigneeId: UUID
}

input ContentCreateInput {
  title: String!
  contentType: String!
  channel: String!
  brief: String
  targetKeywordIds: [UUID!]!
  assigneeId: UUID
}

input ContentUpdateInput {
  title: String
  content: String
  metaDescription: String
  status: ContentStatus
  reviewerId: UUID
}

# ==================== 分页类型 ====================

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
  totalCount: Int!
}

type KeywordConnection {
  edges: [KeywordEdge!]!
  pageInfo: PageInfo!
}

type KeywordEdge {
  node: Keyword!
  cursor: String!
}
```

### 2.2 Query 定义

```graphql
type Query {
  # ========== 用户查询 ==========
  me: User!
  user(id: UUID!): User
  users(filter: UserFilterInput, pagination: PaginationInput): UserConnection!
  
  # ========== 关键词查询 ==========
  keyword(id: UUID!): Keyword
  keywords(
    filter: KeywordFilterInput
    sort: KeywordSortInput
    pagination: PaginationInput
  ): KeywordConnection!
  
  # 关键词分析
  keywordOpportunities(limit: Int = 10): [Keyword!]!
  keywordClusters: [KeywordCluster!]!
  keywordCompetitors(keywordId: UUID!): [CompetitorAnalysis!]!
  
  # ========== 内容查询 ==========
  content(id: UUID!): ContentItem
  contentBySlug(slug: String!): ContentItem
  contents(
    filter: ContentFilterInput
    sort: ContentSortInput
    pagination: PaginationInput
  ): ContentConnection!
  
  # ========== 分析查询 ==========
  dashboard(timeRange: TimeRangeInput): DashboardData!
  performanceReport(type: ReportType!, date: DateTime!): PerformanceReport
  keywordTrends(keywordId: UUID!, days: Int = 30): [KeywordMetric!]!
  
  # ========== 工作流查询 ==========
  myTasks(status: TaskStatus): [Task!]!
  pendingApprovals: [ContentItem!]!
  
  # ========== AI 查询 ==========
  aiContentSuggestions(keywordId: UUID!): ContentSuggestionResponse!
  aiKeywordRecommendations(seedKeywords: [String!]!): [KeywordRecommendation!]!
}
```

### 2.3 Mutation 定义

```graphql
type Mutation {
  # ========== 认证 ==========
  login(email: String!, password: String!): AuthResponse!
  logout: Boolean!
  refreshToken(token: String!): AuthResponse!
  
  # ========== 关键词操作 ==========
  createKeyword(input: KeywordCreateInput!): Keyword!
  updateKeyword(id: UUID!, input: KeywordUpdateInput!): Keyword!
  deleteKeyword(id: UUID!): Boolean!
  
  # 批量操作
  importKeywords(file: Upload!, mapping: KeywordMappingInput): ImportResult!
  bulkUpdateKeywordPriority(ids: [UUID!]!, priority: KeywordPriority!): [Keyword!]!
  
  # ========== 内容操作 ==========
  createContent(input: ContentCreateInput!): ContentItem!
  updateContent(id: UUID!, input: ContentUpdateInput!): ContentItem!
  deleteContent(id: UUID!): Boolean!
  
  # 内容工作流
  submitForReview(id: UUID!): ContentItem!
  approveContent(id: UUID!, comments: String): ContentItem!
  rejectContent(id: UUID!, reason: String!): ContentItem!
  publishContent(id: UUID!, channels: [String!]!): PublishResult!
  
  # ========== 任务操作 ==========
  createTask(input: TaskCreateInput!): Task!
  updateTaskStatus(id: UUID!, status: TaskStatus!): Task!
  assignTask(id: UUID!, assigneeId: UUID!): Task!
  
  # ========== AI 操作 ==========
  generateContentBrief(keywordId: UUID!): ContentBrief!
  optimizeContent(contentId: UUID!): OptimizationResult!
  generateAIOAnswer(keywordId: UUID!): String!
}
```

### 2.4 Subscription 定义

```graphql
type Subscription {
  # 内容协作
  contentUpdated(contentId: UUID!): ContentUpdateEvent!
  
  # 实时通知
  notificationReceived: Notification!
  
  # 任务更新
  taskAssigned: Task!
  taskStatusChanged(taskId: UUID!): Task!
  
  # 分析数据
  metricsUpdated: MetricsUpdateEvent!
  keywordRankingChanged(keywordIds: [UUID!]!): KeywordRankingEvent!
}
```

## 3. REST API 设计

### 3.1 文件上传

```
POST /api/v1/upload/keywords
Content-Type: multipart/form-data

Response:
{
  "uploadId": "uuid",
  "fileName": "keywords.csv",
  "rowCount": 850,
  "validationErrors": []
}
```

### 3.2 导出接口

```
GET /api/v1/export/keywords?format=csv&filter[priority]=P0,P1
Authorization: Bearer {token}

Response: CSV file download
```

### 3.3 第三方 Webhook

```
POST /api/v1/webhooks/google-search-console
Content-Type: application/json

{
  "event": "ranking_update",
  "data": {
    "keyword": "smart doorbell",
    "position": 3,
    "impressions": 15000
  }
}
```

## 4. 认证与授权

### 4.1 JWT Token 结构

```json
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "role": "STRATEGIST",
  "permissions": ["view:keywords", "edit:content"],
  "iat": 1701936000,
  "exp": 1701939600
}
```

### 4.2 权限控制

```typescript
// GraphQL Directive
@auth(requires: [STRATEGIST, ADMIN])
@rateLimit(window: "1m", max: 100)

// 字段级权限
type Keyword {
  searchVolume: Int @auth(requires: [STRATEGIST])
  internalNotes: String @auth(requires: [ADMIN])
}
```

## 5. API 性能优化

### 5.1 DataLoader 批量加载

```typescript
// 避免 N+1 查询
const keywordLoader = new DataLoader(async (ids) => {
  const keywords = await prisma.keyword.findMany({
    where: { id: { in: ids } }
  });
  return ids.map(id => keywords.find(k => k.id === id));
});
```

### 5.2 查询复杂度限制

```graphql
# 最大查询深度: 5
# 最大查询复杂度: 1000

query TooComplex {
  keywords {
    contentItems {
      keywords {
        contentItems {  # 深度限制
          ...
        }
      }
    }
  }
}
```

### 5.3 缓存策略

```typescript
// Redis 缓存装饰器
@CacheKey('keyword:{id}')
@CacheTTL(300) // 5分钟
async getKeyword(id: string) {
  return this.keywordService.findById(id);
}
```

## 6. 错误处理

### 6.1 错误格式

```json
{
  "errors": [
    {
      "code": "KEYWORD_NOT_FOUND",
      "message": "关键词不存在",
      "path": ["keyword", "id"],
      "extensions": {
        "timestamp": "2024-01-01T00:00:00Z",
        "requestId": "req_123"
      }
    }
  ]
}
```

### 6.2 错误代码

| 错误代码 | HTTP 状态码 | 说明 |
|---------|------------|------|
| UNAUTHORIZED | 401 | 未认证 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 输入验证失败 |
| RATE_LIMIT_EXCEEDED | 429 | 请求过于频繁 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 7. API 文档与测试

### 7.1 GraphQL Playground

- 开发环境: http://localhost:4000/graphql
- 自动生成文档
- 查询历史记录
- Schema 探索

### 7.2 OpenAPI (REST)

```yaml
openapi: 3.0.0
info:
  title: GEO Platform API
  version: 1.0.0
paths:
  /api/v1/upload/keywords:
    post:
      summary: 上传关键词文件
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
```

### 7.3 API 测试策略

1. **单元测试**: 每个 resolver 和 service
2. **集成测试**: GraphQL 查询和变更
3. **负载测试**: 性能基准测试
4. **安全测试**: 认证、授权、注入防护

## 8. API 版本管理

### 8.1 GraphQL 版本策略

- Schema 演进而非版本化
- 使用 @deprecated 标记废弃字段
- 保持向后兼容

### 8.2 REST API 版本

- URL 版本: /api/v1/, /api/v2/
- 渐进式迁移
- 版本生命周期管理

## 9. 监控与日志

### 9.1 API 指标

- 请求速率 (QPS)
- 响应时间 (P50, P95, P99)
- 错误率
- 查询复杂度分布

### 9.2 日志规范

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info",
  "requestId": "req_123",
  "userId": "user_456",
  "operation": "createKeyword",
  "duration": 123,
  "status": "success"
}