# Eufy GEO 协同作战平台

![CI/CD](https://github.com/keevingfu/eufygeo3/workflows/CI/CD%20Pipeline/badge.svg)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

> 🚀 AI 驱动的新一代搜索引擎优化（GEO）平台，专为 Eufy 智能家居产品打造

## 项目概述

Eufy GEO 平台是一个创新的 SEO 策略平台，专注于优化 AI 生成的搜索结果（Google AIO、YouTube、Reddit）。通过精准的关键词分层管理、AI 辅助内容创作和多渠道协同发布，帮助 Eufy 在 AI 搜索时代建立品牌权威。

### 核心特性

- 🎯 **关键词金字塔管理** - P0-P4 分层策略，集中资源攻克高价值关键词
- 🤖 **AI 内容助手** - GPT-4/Claude 集成，智能生成 AIO 优化内容
- 📊 **实时数据分析** - AIO 覆盖率监控、ROI 追踪、竞争分析
- 🔄 **多渠道协同** - Google、YouTube、Reddit 统一管理
- 📈 **智能工作流** - 从创作到发布的全流程自动化

## 快速开始

### 前置要求

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker Desktop
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone [repository-url]
cd eufygeo3
```

2. **运行安装向导**
```bash
npm run setup
```

3. **快速启动**
```bash
./scripts/quick-start.sh
```

4. **访问应用**
- 前端: http://localhost:3000
- 后端 API: http://localhost:4000
- GraphQL: http://localhost:4000/graphql

### 默认登录

- 邮箱: admin@eufy-geo.com
- 密码: Admin123!

## 项目结构

```
eufygeo3/
├── backend/          # NestJS 后端服务
├── frontend/         # Next.js 前端应用
├── shared/           # 共享类型和工具
├── docs/            # 项目文档
│   ├── architecture/  # 架构设计
│   ├── api/          # API 文档
│   └── database/     # 数据库设计
├── scripts/          # 自动化脚本
└── docker-compose.yml # Docker 服务配置
```

## 技术栈

### 后端
- **框架**: NestJS + TypeScript
- **数据库**: PostgreSQL + Neo4j + Redis
- **API**: GraphQL (Apollo) + REST
- **ORM**: Prisma
- **搜索**: Elasticsearch
- **AI**: OpenAI + Qdrant

### 前端
- **框架**: Next.js 14 (App Router)
- **UI**: Ant Design Pro + Tailwind CSS
- **状态管理**: Zustand + React Query
- **编辑器**: Lexical
- **图表**: ECharts + Recharts

## 核心功能模块

### 1. 关键词管理
- CSV 批量导入
- 自动 P0-P4 分层
- AIO 状态实时监测
- 竞争分析图谱

### 2. 内容创作
- AI 大纲生成
- 实时优化建议
- 版本控制
- 协作编辑

### 3. 工作流引擎
- 自定义审批流程
- 任务自动分配
- 进度追踪
- 通知提醒

### 4. 数据分析
- KPI 仪表板
- ROI 计算
- 趋势预测
- 自定义报表

## 开发指南

### 常用命令

```bash
# 开发
npm run dev              # 启动所有服务
npm run dev:backend      # 仅启动后端
npm run dev:frontend     # 仅启动前端

# 数据库
npm run db:migrate       # 运行迁移
npm run db:seed          # 导入种子数据
npm run db:studio        # 打开 Prisma Studio

# 测试
npm test                 # 运行所有测试
npm run test:e2e         # E2E 测试

# 构建
npm run build            # 构建生产版本

# 部署
npm run deploy           # 自动构建并部署到GitHub
npm run deploy:sync      # 仅同步代码到远程仓库

# Docker
npm run docker:up        # 启动容器
npm run docker:down      # 停止容器
npm run docker:logs      # 查看日志
```

### 环境变量

复制 `.env.example` 文件并重命名为 `.env`，填写必要的配置：

```bash
# 后端
cp backend/.env.example backend/.env

# 前端
cp frontend/.env.example frontend/.env
```

### API 开发

GraphQL Schema 定义在 `backend/src/schema.graphql`

```graphql
type Query {
  keywords(filter: KeywordFilter): KeywordConnection!
  keyword(id: UUID!): Keyword
}

type Mutation {
  createKeyword(input: KeywordCreateInput!): Keyword!
  updateKeyword(id: UUID!, input: KeywordUpdateInput!): Keyword!
}
```

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t eufy-geo-backend ./backend
docker build -t eufy-geo-frontend ./frontend

# 使用 docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes 部署

```bash
# 应用配置
kubectl apply -f k8s/
```

## 项目文档

- [系统架构设计](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [数据库设计](docs/database/DATABASE_DESIGN.md)
- [API 架构](docs/api/API_ARCHITECTURE.md)
- [前端架构](docs/architecture/FRONTEND_ARCHITECTURE.md)
- [实施计划](IMPLEMENTATION_PLAN.md)

## 性能指标

- API 响应时间: P95 < 200ms
- 页面加载时间: < 2s
- 并发用户数: 1000+
- 系统可用性: 99.9%

## 安全性

- JWT 认证
- RBAC 权限控制
- 数据加密存储
- API 限流保护
- 审计日志

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## CI/CD 自动化

项目采用 GitHub Actions 进行持续集成/持续部署：

### 自动化流程
1. **代码提交** → 自动触发CI/CD流水线
2. **测试执行** → 运行单元测试和集成测试
3. **代码检查** → ESLint、Prettier格式化
4. **构建验证** → 前端和后端构建验证
5. **自动部署** → 推送到生产环境

### 快速部署
```bash
# 一键部署（构建 + 推送到GitHub）
npm run deploy

# 仅同步代码
npm run deploy:sync
```

### GitHub仓库
- 主仓库: https://github.com/keevingfu/eufygeo3
- CI/CD状态: 实时监控构建和部署状态
- 分支策略: main分支自动部署，develop分支用于开发

## 联系方式

- 项目维护者: Claude AI
- 仓库地址: https://github.com/keevingfu/eufygeo3
- 问题反馈: [GitHub Issues](https://github.com/keevingfu/eufygeo3/issues)

---

🌟 **Eufy GEO Platform** - 让 AI 成为品牌的最佳代言人