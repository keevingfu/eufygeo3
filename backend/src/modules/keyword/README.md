# 关键词管理 API 模块

## 概述

这是一个完整的、类型安全的关键词管理 API 模块，基于 NestJS + GraphQL + Prisma 构建，专为 Eufy GEO 平台设计。该模块支持关键词的 CRUD 操作、AIO 状态监测、性能优化以及全面的单元测试。

## 功能特性

### 🔑 核心功能
- **完整的 CRUD 操作**：创建、读取、更新、删除关键词
- **高级查询功能**：支持复杂过滤、排序、分页
- **批量操作**：批量更新多个关键词
- **全文搜索**：智能关键词搜索
- **AIO 监测**：AI Overview 状态跟踪

### 🏗️ 架构特性
- **严格类型安全**：完整的 TypeScript 类型定义
- **GraphQL API**：现代化的 API 设计
- **DataLoader 优化**：解决 N+1 查询问题
- **智能缓存**：提高查询性能
- **异常处理**：统一的错误处理机制

### 📊 数据验证
- **实时验证**：class-validator 数据验证
- **自定义验证器**：业务逻辑验证
- **类型约束**：编译时类型检查

## 项目结构

```
src/modules/keyword/
├── dto/                    # GraphQL 输入输出类型
│   └── keyword.dto.ts
├── exceptions/             # 异常处理
│   └── keyword.exceptions.ts
├── filters/               # 异常过滤器
│   └── keyword-exception.filter.ts
├── interceptors/          # 拦截器
│   ├── keyword-cache.interceptor.ts
│   └── keyword-logging.interceptor.ts
├── loaders/               # DataLoader 批量数据加载
│   └── keyword.loader.ts
├── resolvers/             # GraphQL 解析器
│   └── keyword.resolver.ts
├── services/              # 业务逻辑服务
│   └── keyword.service.ts
├── tests/                 # 单元测试
│   ├── keyword.service.spec.ts
│   └── keyword.resolver.spec.ts
├── types/                 # TypeScript 类型定义
│   └── keyword.types.ts
├── validators/            # 自定义验证器
│   └── keyword.validators.ts
├── keyword.module.ts      # NestJS 模块配置
└── README.md
```

## 快速开始

### 1. 环境要求

- Node.js 18+
- TypeScript 5.0+
- NestJS 10+
- Prisma 5+
- PostgreSQL 14+

### 2. 依赖安装

```bash
npm install @nestjs/graphql @nestjs/apollo
npm install @apollo/server graphql
npm install @nestjs/cache-manager cache-manager
npm install class-validator class-transformer
npm install dataloader
npm install prisma-graphql-type-decimal
```

### 3. 模块注册

在 `app.module.ts` 中注册关键词模块：

```typescript
import { KeywordModule } from './modules/keyword/keyword.module';

@Module({
  imports: [
    // ... 其他模块
    KeywordModule,
  ],
})
export class AppModule {}
```

### 4. GraphQL Schema 生成

启动应用后，GraphQL schema 会自动生成，包含以下主要类型：

```graphql
type Keyword {
  id: ID!
  text: String!
  searchVolume: Int
  difficulty: Decimal
  priorityLevel: KeywordPriorityLevel
  aioStatus: AIOStatus!
  assignee: UserInfo
  creator: UserInfo!
  metrics: [KeywordMetric!]
  # ... 更多字段
}

type Query {
  keyword(id: ID!): Keyword
  keywords(input: KeywordQueryInput): PaginatedKeywords
  searchKeywords(query: String!, limit: Int): [Keyword!]!
  aioStats: AIOStats!
}

type Mutation {
  createKeyword(input: CreateKeywordInput!): Keyword!
  updateKeyword(input: UpdateKeywordInput!): Keyword!
  deleteKeyword(id: ID!): Boolean!
  bulkUpdateKeywords(input: BulkUpdateKeywordsInput!): BulkOperationResult!
  addAIOMonitoring(input: AIOMonitoringInput!): Boolean!
}
```

## API 使用示例

### 查询关键词

```graphql
query GetKeywords($input: KeywordQueryInput) {
  keywords(input: $input) {
    data {
      id
      text
      searchVolume
      priorityLevel
      aioStatus
      creator {
        username
        fullName
      }
      latestPosition
      performanceScore
    }
    pagination {
      total
      page
      totalPages
      hasNextPage
    }
  }
}

# Variables
{
  "input": {
    "filters": {
      "priorityLevels": ["P0", "P1"],
      "aioStatuses": ["DISPLAYED"],
      "searchVolumeMin": 1000
    },
    "sort": [
      { "field": "searchVolume", "direction": "desc" }
    ],
    "pagination": {
      "page": 1,
      "limit": 20
    }
  }
}
```

### 创建关键词

```graphql
mutation CreateKeyword($input: CreateKeywordInput!) {
  createKeyword(input: $input) {
    id
    text
    priorityLevel
    status
    creator {
      username
    }
  }
}

# Variables
{
  "input": {
    "text": "eufy security camera 4k",
    "searchVolume": 8500,
    "difficulty": 65.5,
    "cpc": 3.20,
    "priorityLevel": "P1",
    "competitionLevel": "MEDIUM",
    "intentType": "COMMERCIAL",
    "productLine": "CAMERA",
    "stage": "MOFU"
  }
}
```

### 批量更新关键词

```graphql
mutation BulkUpdateKeywords($input: BulkUpdateKeywordsInput!) {
  bulkUpdateKeywords(input: $input) {
    success
    updatedCount
    errors
  }
}

# Variables
{
  "input": {
    "keywordIds": ["keyword-1", "keyword-2", "keyword-3"],
    "priorityLevel": "P0",
    "status": "ACTIVE"
  }
}
```

### AIO 监测数据

```graphql
mutation AddAIOMonitoring($input: AIOMonitoringInput!) {
  addAIOMonitoring(input: $input) 
}

# Variables
{
  "input": {
    "keywordId": "keyword-123",
    "aioDisplayed": true,
    "aioPosition": 2,
    "aioContentSnippet": "Eufy security cameras offer...",
    "metricDate": "2024-01-15T00:00:00Z"
  }
}
```

### 查询 AIO 统计

```graphql
query GetAIOStats {
  aioStats {
    totalMonitored
    totalDisplayed
    displayRate
    averagePosition
    p0Stats {
      monitored
      displayed
      rate
    }
    p1Stats {
      monitored
      displayed
      rate
    }
  }
}
```

## 性能优化

### DataLoader 使用

模块集成了 DataLoader 来解决 N+1 查询问题：

```typescript
// 自动批量加载关键词
const keywords = await context.loaders.getKeywordLoader().loadMany(keywordIds);

// 批量加载用户信息
const users = await context.loaders.getUserLoader().loadMany(userIds);

// 批量加载关键词指标
const metrics = await context.loaders.getKeywordMetricsLoader().load(keywordId);
```

### 智能缓存

- **查询缓存**：GET 操作自动缓存
- **失效策略**：变更操作自动清除相关缓存
- **分层缓存**：不同操作使用不同的 TTL

### 数据库优化

- **索引优化**：关键字段建立索引
- **查询优化**：避免 N+1 查询
- **分页查询**：支持高效分页

## 测试

### 运行单元测试

```bash
# 运行所有测试
npm run test

# 运行关键词模块测试
npm run test -- keyword

# 生成测试覆盖率报告
npm run test:cov
```

### 测试覆盖

- **Service 测试**：100% 业务逻辑覆盖
- **Resolver 测试**：100% GraphQL 操作覆盖
- **异常测试**：完整的错误场景测试
- **集成测试**：端到端功能测试

## 监控和日志

### 操作日志

所有关键词操作都会记录详细的审计日志：

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "operationType": "CREATE",
  "operationName": "createKeyword",
  "userId": "user-123",
  "resourceId": "keyword-456",
  "success": true,
  "duration": 156,
  "clientInfo": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### 性能监控

- **响应时间**：记录每个操作的执行时间
- **缓存命中率**：监控缓存效果
- **数据库查询**：追踪查询性能
- **错误率**：监控操作成功率

## 错误处理

### 标准错误格式

```json
{
  "code": "KEYWORD_NOT_FOUND",
  "message": "关键词不存在: keyword-123",
  "details": {
    "keywordId": "keyword-123"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 错误类型

- `KEYWORD_NOT_FOUND`: 关键词不存在
- `KEYWORD_ALREADY_EXISTS`: 关键词已存在
- `INVALID_PRIORITY_LEVEL`: 无效优先级
- `ASSIGNEE_NOT_FOUND`: 分配用户不存在
- `VALIDATION_ERROR`: 数据验证错误
- `DATABASE_ERROR`: 数据库操作错误

## 最佳实践

### 1. 类型安全

```typescript
// 使用严格类型定义
const keyword: KeywordWithRelations = await keywordService.getKeywordById(id);

// 避免 any 类型
const filters: KeywordFilters = {
  priorityLevel: KeywordPriorityLevel.P1,
  status: KeywordStatus.ACTIVE,
};
```

### 2. 错误处理

```typescript
try {
  const keyword = await keywordService.createKeyword(input, userId);
  return keyword;
} catch (error) {
  if (error instanceof KeywordAlreadyExistsException) {
    // 处理特定业务异常
  }
  throw error;
}
```

### 3. 性能优化

```typescript
// 使用 DataLoader 批量加载
const [assignees, creators] = await Promise.all([
  context.loaders.getUserLoader().loadMany(assigneeIds),
  context.loaders.getUserLoader().loadMany(creatorIds),
]);

// 合理设置分页大小
const result = await keywordService.getKeywords({
  pagination: { page: 1, limit: 50 }, // 避免过大的 limit
});
```

### 4. 数据验证

```typescript
// 使用装饰器验证
@Field()
@IsKeywordTextValid()
@IsKeywordTextUnique()
readonly text: string;

// 业务规则验证
const errors = validateKeywordBusinessRules({
  priorityLevel: KeywordPriorityLevel.P0,
  searchVolume: 500, // 会触发验证错误
});
```

## 扩展指南

### 添加新的查询字段

1. 在 `keyword.types.ts` 中定义类型
2. 在 `keyword.dto.ts` 中添加 GraphQL 类型
3. 在 `keyword.resolver.ts` 中实现字段解析器
4. 添加相应的测试

### 添加新的业务规则

1. 在 `keyword.validators.ts` 中创建验证器
2. 在 DTO 中应用验证装饰器
3. 在 Service 中实现业务逻辑
4. 添加异常处理

### 优化查询性能

1. 在 DataLoader 中添加新的加载器
2. 在缓存拦截器中配置缓存策略
3. 在数据库中添加适当的索引
4. 监控查询性能指标

## 贡献指南

1. **代码风格**：遵循 TypeScript 严格模式
2. **测试覆盖**：新功能必须包含单元测试
3. **文档更新**：更新相关文档和类型定义
4. **性能考虑**：考虑对现有功能的性能影响

## 许可证

MIT License - 详见 LICENSE 文件