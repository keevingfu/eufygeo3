# CLAUDE.md - Eufy GEO 平台项目配置

这个文件为 Claude Code 提供项目上下文和配置信息。

## 项目概述

**Eufy GEO 协同作战平台** 是一个创新的 AI 驱动搜索引擎优化平台，专注于 Google AIO（AI Overview）、YouTube 和 Reddit 三大渠道的内容优化和品牌权威建立。

### 核心理念
- **GEO vs 传统SEO**: 不追求排名，而是成为 AI 生成答案的权威信息源
- **关键词金字塔**: P0-P4 分层策略，集中80%资源攻克 P0 核心关键词
- **三位一体协同**: Google + YouTube + Reddit 全域布局

## 项目当前状态

### ✅ 已完成阶段

1. **需求分析与架构设计**
   - 分析了三个核心需求文档
   - 提取了关键词管理、内容生产、工作流引擎、数据分析四大模块
   - 设计了微服务架构和多数据库策略

2. **技术栈确定**
   - 后端: NestJS + GraphQL + PostgreSQL + Neo4j + Redis
   - 前端: Next.js 14 + Ant Design Pro + ECharts + Lexical
   - AI: OpenAI GPT-4 + Qdrant 向量数据库
   - 基础设施: Docker + Kubernetes

3. **数据库设计**
   - PostgreSQL: 用户、关键词、内容、任务、分析数据
   - Neo4j: 关键词关系图谱、竞争分析
   - Redis: 缓存、会话、任务队列
   - Prisma Schema 已完成

4. **API 架构**
   - GraphQL Schema 设计完成
   - 认证授权体系（JWT + RBAC）
   - 实时订阅和性能优化策略

5. **项目结构**
   - 完整的目录结构和配置文件
   - Docker Compose 多服务配置
   - 自动化脚本和文档

### 📅 实施计划

**Phase 1 (Week 1-4): 基础设施与核心功能**
- Week 1: 项目启动与环境搭建
- Week 2: 数据库设计与后端基础
- Week 3: 关键词管理核心功能
- Week 4: 数据集成与监控基础

**Phase 2 (Week 5-8): 内容管理与工作流**
- Week 5: 内容管理系统
- Week 6: AI 集成与智能功能
- Week 7: 工作流引擎
- Week 8: 多渠道发布系统

**Phase 3 (Week 9-12): 数据分析与优化**
- Week 9: 高级分析功能
- Week 10: 性能优化与扩展
- Week 11: 测试与修复
- Week 12: 部署与上线

## SuperClaude 增强配置

### 1. 核心配置
- **高性能模式**: 优化效率和速度
- **智能自主模式**: 自主问题解决
- **批判性思维模式**: 主动识别问题
- **高级Token经济**: 智能上下文管理

### 2. 集成 MCP 服务器
项目可用的 MCP 服务器：
- 🧠 **Sequential Thinking** - 结构化问题分解
- 🌐 **Puppeteer** - E2E测试的浏览器自动化
- 🎨 **Magic** - AI驱动的UI组件生成
- 📁 **Filesystem** - 高级文件操作
- 💾 **Memory** - 知识图谱持久化
- 🔧 **Git/GitHub** - 版本控制集成
- 🗄️ **SQLite** - 本地分析数据库

### 3. BMAD Method 框架
使用专业化代理的敏捷AI驱动开发：
- **Analyst** - 市场研究和竞争分析
- **Architect** - 系统设计和技术决策
- **PM/PO** - 产品管理和用户故事创建
- **Developer** - 最佳实践实施
- **QA** - 测试和质量保证
- **UX Expert** - 用户体验优化

### 4. Context Engineering
全面功能开发命令：
- `/generate-prp` - 创建产品需求提示
- `/execute-prp` - 一次性成功实现功能
- 自动验证循环和测试

### 5. 开发者配置
专业化子代理和工具：
- **code-reviewer** - 自动代码质量检查
- **typescript-expert** - 类型安全开发
- **frontend-developer** - HTML/CSS/JS/React/Next.js 最佳实践
- **api-documenter** - OpenAPI 文档
- **test-automator** - 全面测试覆盖

### 6. 语言标准
- **用户交互**: 中文（中文）
- **代码生成**: 仅英文（变量、函数、注释）
- **UI元素**: 仅英文（标签、按钮、消息）

## 项目架构

### 技术栈
```
Frontend: Next.js 14 + React + TypeScript + Ant Design Pro
Backend: NestJS + GraphQL + Prisma + TypeScript
Database: PostgreSQL + Neo4j + Redis + Elasticsearch + Qdrant
AI/ML: OpenAI GPT-4 + Claude + Embeddings
Infrastructure: Docker + Kubernetes + AWS/阿里云
```

### 核心模块

#### 1. 关键词管理模块
- P0-P4 分层算法
- CSV批量导入
- AIO状态监测
- 竞争分析图谱（Neo4j）

#### 2. 内容生命周期管理
- AI辅助内容创作（Lexical编辑器）
- 优化检查清单
- 版本控制
- 审核工作流

#### 3. 全渠道分发协同
- Google内容发布
- YouTube元数据管理
- Reddit社区运营
- 发布日历

#### 4. 数据洞察与分析
- 实时KPI仪表板
- ROI计算引擎
- 趋势预测
- 自定义报表

### API设计
- **GraphQL**: 主要接口，复杂查询和实时订阅
- **REST**: 文件上传、第三方集成
- **WebSocket**: 实时协作和通知
- **认证**: JWT + RBAC权限模型

### 数据模型
- **用户与权限**: 多角色协作体系
- **关键词**: 850+关键词的分层管理
- **内容**: 从创作到发布的全生命周期
- **分析**: 实时数据采集和性能指标
- **工作流**: 可配置的审批流程

## 开发指导

### 常用命令
```bash
# 项目初始化
npm run setup

# 快速启动
./scripts/quick-start.sh

# 开发环境
npm run dev              # 启动所有服务
npm run dev:backend      # 仅后端
npm run dev:frontend     # 仅前端

# 数据库
npm run db:migrate       # 运行迁移
npm run db:seed          # 种子数据
npm run db:studio        # Prisma Studio

# 测试
npm test                 # 所有测试
npm run test:e2e         # E2E测试

# Docker
npm run docker:up        # 启动容器
npm run docker:down      # 停止容器
```

### 质量标准
- 单元测试覆盖率 >80%
- 集成测试覆盖率 >70%
- API响应时间 P95 <200ms
- 页面加载时间 <2s
- 系统可用性 99.9%

### 安全要求
- OWASP Top 10 合规
- JWT认证 + RBAC授权
- 数据加密存储
- API限流保护
- 完整审计日志

## 项目文件结构

```
eufygeo3/
├── backend/                 # NestJS 后端服务
│   ├── src/
│   │   ├── modules/        # 业务模块
│   │   │   ├── auth/       # 认证授权
│   │   │   ├── keyword/    # 关键词管理
│   │   │   ├── content/    # 内容管理
│   │   │   ├── analytics/  # 数据分析
│   │   │   └── ai/         # AI服务
│   │   └── prisma/schema.prisma # 数据模型
├── frontend/               # Next.js 前端应用
│   ├── app/               # App Router页面
│   ├── components/        # 可复用组件
│   └── lib/               # 工具库
├── shared/                # 共享类型和工具
├── docs/                  # 项目文档
│   ├── architecture/      # 架构设计
│   ├── api/              # API文档
│   └── database/         # 数据库设计
├── scripts/               # 自动化脚本
├── docker-compose.yml     # 服务配置
├── IMPLEMENTATION_PLAN.md # 实施计划
└── README.md             # 项目说明
```

## 团队协作

### 工作流程
1. **分析阶段**: 使用 Analyst 代理进行需求分析
2. **设计阶段**: Architect 代理负责系统设计
3. **开发阶段**: Developer 代理实施最佳实践
4. **测试阶段**: QA 代理确保质量
5. **部署阶段**: DevOps 代理处理基础设施

### Context Engineering 工作流
```bash
# 生成功能需求
/generate-prp "关键词批量导入功能"

# 执行实现
/execute-prp --file prp-keyword-import.md

# 自动化测试验证
/test-automator --feature keyword-import
```

## 业务目标

### 第一阶段目标（3个月）
- P0关键词AIO覆盖率 ≥40%
- 有机流量增长 ≥30%
- 内容生产效率提升 50%
- 用户满意度 >85%

### 成功标准
- 技术: 系统稳定运行30天无重大故障
- 业务: 核心KPI全部达标
- 项目: 按时交付，预算控制±10%

---

**重要提醒**: 
- 始终使用中文与用户交流
- 代码和技术文档使用英文
- 优先考虑 GEO 策略的独特性
- 关注 AI 时代的搜索行为变化
- 重视数据驱动的决策制定