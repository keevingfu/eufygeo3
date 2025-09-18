# GEO 平台数据库设计文档

## 1. 数据库架构概览

### 1.1 多数据库策略
- **PostgreSQL**: 主数据存储（用户、关键词、内容、工作流）
- **Neo4j**: 关键词关系图谱、竞争分析
- **Redis**: 缓存、会话、任务队列
- **Elasticsearch**: 全文搜索、日志分析
- **Qdrant**: 向量数据库（语义搜索、AI embeddings）

## 2. PostgreSQL 数据模型

### 2.1 用户与权限模块

#### users（用户表）
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    avatar_url VARCHAR(500),
    role_id UUID NOT NULL,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
```

#### roles（角色表）
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 预定义角色
INSERT INTO roles (name, display_name, permissions) VALUES
('admin', '系统管理员', '["*"]'),
('manager', '业务负责人', '["view:*", "edit:strategy", "approve:content"]'),
('strategist', 'SEO策略师', '["view:*", "edit:keyword", "edit:content", "view:analytics"]'),
('creator', '内容创作者', '["view:keyword", "edit:content", "view:own-tasks"]'),
('operator', '渠道运营', '["view:content", "publish:content", "view:analytics"]');
```

### 2.2 关键词管理模块

#### keywords（关键词主表）
```sql
CREATE TABLE keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text VARCHAR(500) NOT NULL,
    search_volume INTEGER,
    difficulty DECIMAL(5,2),
    cpc DECIMAL(10,2),
    competition_level VARCHAR(20), -- low, medium, high
    priority_level VARCHAR(10), -- P0, P1, P2, P3, P4
    intent_type VARCHAR(50), -- informational, navigational, transactional, commercial
    product_line VARCHAR(100), -- camera, doorbell, vacuum, lock
    stage VARCHAR(20), -- TOFU, MOFU, BOFU
    
    -- AIO 相关
    aio_status VARCHAR(50) DEFAULT 'not_monitored', -- yes, no, monitoring, not_monitored
    aio_first_seen_at TIMESTAMP WITH TIME ZONE,
    aio_coverage_score DECIMAL(5,2),
    
    -- 状态跟踪
    status VARCHAR(50) DEFAULT 'active', -- active, archived, paused
    assigned_to UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_keywords_text ON keywords(text);
CREATE INDEX idx_keywords_priority ON keywords(priority_level);
CREATE INDEX idx_keywords_status ON keywords(status);
CREATE INDEX idx_keywords_aio ON keywords(aio_status);
```

#### keyword_metrics（关键词指标历史表）
```sql
CREATE TABLE keyword_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword_id UUID NOT NULL,
    metric_date DATE NOT NULL,
    
    -- 排名数据
    google_position INTEGER,
    google_featured_snippet BOOLEAN DEFAULT false,
    google_people_also_ask BOOLEAN DEFAULT false,
    
    -- AIO 数据
    aio_displayed BOOLEAN DEFAULT false,
    aio_position INTEGER,
    aio_content_snippet TEXT,
    
    -- 流量数据
    organic_traffic INTEGER,
    organic_ctr DECIMAL(5,2),
    
    -- 竞争数据
    top_competitors JSONB, -- [{domain, position, traffic_share}]
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE,
    UNIQUE(keyword_id, metric_date)
);

CREATE INDEX idx_keyword_metrics_date ON keyword_metrics(metric_date);
```

### 2.3 内容管理模块

#### content_items（内容表）
```sql
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- article, video_script, reddit_post
    channel VARCHAR(50) NOT NULL, -- google, youtube, reddit
    
    -- 内容详情
    brief TEXT,
    content TEXT,
    meta_description VARCHAR(500),
    target_keywords UUID[], -- 关联多个关键词
    
    -- AI 辅助
    ai_suggestions JSONB,
    ai_score DECIMAL(5,2),
    optimization_checklist JSONB,
    
    -- 工作流
    status VARCHAR(50) DEFAULT 'draft', -- draft, in_review, approved, published, archived
    workflow_stage VARCHAR(50),
    assigned_to UUID,
    reviewer_id UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- 发布信息
    published_at TIMESTAMP WITH TIME ZONE,
    published_url VARCHAR(1000),
    external_id VARCHAR(255), -- YouTube video ID, Reddit post ID
    
    -- 版本控制
    version INTEGER DEFAULT 1,
    parent_id UUID,
    
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES content_items(id)
);

CREATE INDEX idx_content_status ON content_items(status);
CREATE INDEX idx_content_channel ON content_items(channel);
CREATE INDEX idx_content_published ON content_items(published_at);
```

#### content_versions（内容版本历史表）
```sql
CREATE TABLE content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    title VARCHAR(500),
    content TEXT,
    changes_summary TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 2.4 工作流模块

#### workflows（工作流定义表）
```sql
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    workflow_type VARCHAR(50) NOT NULL, -- content_approval, keyword_review
    stages JSONB NOT NULL, -- [{name, approvers, actions}]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### workflow_instances（工作流实例表）
```sql
CREATE TABLE workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- content, keyword
    entity_id UUID NOT NULL,
    current_stage VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled
    started_by UUID NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    FOREIGN KEY (started_by) REFERENCES users(id)
);
```

### 2.5 分析数据模块

#### analytics_events（分析事件表）
```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- page_view, aio_display, click, conversion
    source VARCHAR(50) NOT NULL, -- google, youtube, reddit
    
    -- 关联数据
    keyword_id UUID,
    content_id UUID,
    
    -- 事件详情
    event_data JSONB,
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_hash VARCHAR(64),
    
    -- 时间戳
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    FOREIGN KEY (keyword_id) REFERENCES keywords(id),
    FOREIGN KEY (content_id) REFERENCES content_items(id)
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_time ON analytics_events(occurred_at);
CREATE INDEX idx_analytics_events_keyword ON analytics_events(keyword_id);
```

#### performance_reports（性能报告表）
```sql
CREATE TABLE performance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly
    report_date DATE NOT NULL,
    
    -- KPI 数据
    metrics JSONB NOT NULL, -- {aio_coverage, organic_traffic, conversion_rate, roi}
    
    -- 维度数据
    by_keyword JSONB,
    by_content JSONB,
    by_channel JSONB,
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(report_type, report_date)
);
```

### 2.6 任务管理模块

#### tasks（任务表）
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL, -- content_creation, keyword_research, optimization
    priority VARCHAR(20) DEFAULT 'medium', -- urgent, high, medium, low
    
    -- 关联
    keyword_id UUID,
    content_id UUID,
    assigned_to UUID,
    
    -- 时间管理
    due_date DATE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    
    -- 状态
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (keyword_id) REFERENCES keywords(id),
    FOREIGN KEY (content_id) REFERENCES content_items(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_due ON tasks(due_date);
```

## 3. Neo4j 图数据库模型

### 3.1 节点类型

#### Keyword 节点
```cypher
(:Keyword {
    id: "uuid",
    text: "smart doorbell",
    search_volume: 45000,
    priority: "P0",
    aio_status: "yes"
})
```

#### Competitor 节点
```cypher
(:Competitor {
    domain: "ring.com",
    brand: "Ring",
    market_share: 0.234
})
```

#### Content 节点
```cypher
(:Content {
    id: "uuid",
    url: "https://...",
    type: "article",
    aio_optimized: true
})
```

### 3.2 关系类型

```cypher
// 关键词关系
(k1:Keyword)-[:RELATED_TO {similarity: 0.85}]->(k2:Keyword)
(k:Keyword)-[:BELONGS_TO_CLUSTER]->(c:KeywordCluster)

// 竞争关系
(k:Keyword)-[:COMPETED_BY {position: 1, traffic_share: 0.35}]->(c:Competitor)
(c1:Competitor)-[:COMPETES_WITH {overlap_score: 0.72}]->(c2:Competitor)

// 内容关系
(content:Content)-[:TARGETS]->(keyword:Keyword)
(content:Content)-[:OUTRANKS {position_diff: 3}]->(competitor:Competitor)
```

## 4. Redis 数据结构

### 4.1 缓存键设计
```
# 用户会话
session:{user_id} -> {user_data}

# 关键词缓存
keyword:detail:{keyword_id} -> {keyword_data}
keyword:metrics:{keyword_id}:{date} -> {metrics_data}

# 排行榜
ranking:keywords:by_volume -> ZSET
ranking:content:by_performance -> ZSET

# 实时统计
stats:aio:coverage -> {value}
stats:traffic:today -> {value}

# 任务队列
queue:content:generation -> LIST
queue:analytics:update -> LIST
```

### 4.2 过期策略
- 会话数据: 24小时
- 关键词详情: 1小时
- 统计数据: 5分钟
- 排行榜: 10分钟

## 5. 数据库索引策略

### 5.1 PostgreSQL 索引
- B-tree 索引: 主键、外键、状态字段
- GIN 索引: JSONB 字段、数组字段
- 部分索引: 活跃数据的查询优化

### 5.2 Elasticsearch 映射
```json
{
  "mappings": {
    "properties": {
      "keyword": {
        "type": "text",
        "analyzer": "standard"
      },
      "content": {
        "type": "text",
        "analyzer": "english"
      },
      "tags": {
        "type": "keyword"
      },
      "created_at": {
        "type": "date"
      }
    }
  }
}
```

## 6. 数据安全与备份

### 6.1 安全措施
- 敏感数据加密存储
- 行级安全策略 (RLS)
- 审计日志记录

### 6.2 备份策略
- PostgreSQL: 每日全量备份，每小时增量备份
- Neo4j: 每日全量备份
- Redis: AOF 持久化 + 定期快照

## 7. 性能优化

### 7.1 分区策略
- analytics_events: 按月分区
- keyword_metrics: 按月分区

### 7.2 查询优化
- 使用物化视图缓存复杂查询
- 批量操作减少数据库连接
- 异步处理非关键路径操作