# Eufy GEO 平台前端

这是 Eufy GEO（Generative Engine Optimization）平台的前端应用，使用 Next.js 14 构建的现代化关键词管理界面。

## 🚀 技术栈

- **框架**: Next.js 14 (App Router)
- **类型检查**: TypeScript
- **状态管理**: Zustand
- **UI 组件**: Ant Design Pro 5
- **样式**: Tailwind CSS
- **图表**: ECharts
- **表单**: React Hook Form + Zod
- **GraphQL**: Apollo Client
- **构建工具**: Webpack 5 (Next.js 内置)

## 📁 项目结构

```
frontend/
├── app/                          # Next.js App Router 页面
│   ├── globals.css              # 全局样式
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 首页（重定向到关键词管理）
│   └── keywords/                # 关键词管理页面
│       ├── page.tsx             # 关键词列表页
│       └── [id]/                # 关键词详情页
│           └── page.tsx
├── components/                   # 可复用组件
│   ├── charts/                  # 图表组件
│   ├── keyword/                 # 关键词相关组件
│   └── ui/                      # 通用 UI 组件
├── hooks/                        # 自定义 React Hooks
├── lib/                         # 工具库
│   ├── apollo-client.ts         # Apollo Client 配置
│   ├── utils.ts                 # 通用工具函数
│   └── validations/             # 表单验证 schemas
├── stores/                      # Zustand 状态管理
├── types/                       # TypeScript 类型定义
└── services/                    # API 服务
```

## 🎯 核心功能

### 关键词管理
- ✅ 关键词列表展示（表格视图）
- ✅ 高级筛选和排序
- ✅ 批量操作（更新状态、优先级、删除等）
- ✅ 关键词创建和编辑
- ✅ 批量导入导出
- ✅ 层级关系管理

### AIO（AI优化）配置
- ✅ AIO 状态监控
- ✅ 自动优化参数配置
- ✅ 目标排名设置
- ✅ 预算和出价管理

### 数据可视化
- ✅ 性能趋势图表（ECharts）
- ✅ 实时指标监控
- ✅ 多维度数据分析

### 响应式设计
- ✅ 移动端适配
- ✅ 平板端优化
- ✅ 桌面端完整功能

## 🏗️ 开发指南

### 环境要求
- Node.js >= 20.0.0
- npm >= 10.0.0

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
# 启动开发服务器
npm run dev

# 开启类型检查
npm run type-check

# 生成 GraphQL 类型
npm run codegen
```

### 构建和部署
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 导出静态文件
npm run export
```

### 代码质量
```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

## 🎨 设计系统

### 颜色规范
```css
/* 品牌色 */
--primary: #3b82f6;          /* Eufy 蓝 */
--success: #10b981;          /* 成功绿 */
--warning: #f59e0b;          /* 警告橙 */
--error: #ef4444;            /* 错误红 */

/* 优先级颜色 */
--priority-p0: #ef4444;      /* P0 - 红色 */
--priority-p1: #f97316;      /* P1 - 橙色 */
--priority-p2: #eab308;      /* P2 - 黄色 */
--priority-p3: #22c55e;      /* P3 - 绿色 */
--priority-p4: #6b7280;      /* P4 - 灰色 */

/* AIO 状态颜色 */
--aio-active: #10b981;       /* 激活 - 绿色 */
--aio-pending: #f59e0b;      /* 待处理 - 橙色 */
--aio-disabled: #6b7280;     /* 禁用 - 灰色 */
--aio-error: #ef4444;        /* 错误 - 红色 */
```

### 组件规范
- 所有组件使用 TypeScript
- 严格的 Props 类型定义
- 支持主题定制
- 响应式设计优先
- 无障碍访问支持

## 📊 状态管理

使用 Zustand 进行状态管理，主要包括：

### KeywordStore
```typescript
interface KeywordState {
  // 数据状态
  keywords: Keyword[];
  selectedKeywords: string[];
  
  // 查询状态
  filter: KeywordFilter;
  sort: KeywordSort;
  
  // UI 状态
  loading: LoadingState;
  viewMode: 'table' | 'grid' | 'tree';
  
  // 操作方法
  setKeywords: (keywords: Keyword[]) => void;
  updateKeyword: (id: string, updates: Partial<Keyword>) => void;
  // ...更多方法
}
```

## 🔌 API 集成

### GraphQL 查询示例
```typescript
// 获取关键词列表
const GET_KEYWORDS = gql`
  query GetKeywords($filter: KeywordFilter, $sort: KeywordSort) {
    keywords(filter: $filter, sort: $sort) {
      edges {
        node {
          id
          term
          priority
          status
          aioStatus
          metrics {
            clicks
            impressions
            ctr
          }
        }
      }
      pageInfo {
        hasNextPage
        totalCount
      }
    }
  }
`;
```

### 数据变更示例
```typescript
// 更新关键词
const UPDATE_KEYWORD = gql`
  mutation UpdateKeyword($input: UpdateKeywordInput!) {
    updateKeyword(input: $input) {
      keyword {
        id
        term
        priority
        updatedAt
      }
    }
  }
`;
```

## 🧪 测试策略

### 测试类型
- **单元测试**: 组件逻辑和工具函数
- **集成测试**: API 调用和状态管理
- **E2E 测试**: 用户流程和界面交互

### 测试工具
- Jest: 单元测试框架
- Testing Library: React 组件测试
- MSW: API 模拟

## 📱 移动端适配

### 断点设计
```css
/* Tailwind CSS 断点 */
sm: 640px   /* 小型设备 */
md: 768px   /* 中型设备 */
lg: 1024px  /* 大型设备 */
xl: 1280px  /* 超大设备 */
```

### 移动端特性
- 响应式表格
- 触摸友好的交互
- 移动端优化的筛选面板
- 手势导航支持

## ⚡ 性能优化

### 已实现优化
- Next.js 自动代码分割
- 图片懒加载和优化
- 组件级别的状态管理
- 虚拟滚动（大数据量表格）
- 防抖和节流处理

### 监控指标
- Core Web Vitals
- 首屏加载时间
- 交互响应时间
- 内存使用情况

## 🔒 安全考虑

- XSS 防护
- CSRF 令牌
- 内容安全策略 (CSP)
- 表单数据验证
- API 权限控制

## 🌐 国际化支持

目前支持中文界面，架构已预留国际化扩展：
- React Intl 集成准备
- 多语言资源文件结构
- 日期和数字格式化

## 📈 未来规划

### 短期目标
- [ ] WebSocket 实时数据更新
- [ ] 更多图表类型支持
- [ ] 高级筛选条件
- [ ] 数据导入导出优化

### 长期目标
- [ ] PWA 支持
- [ ] 离线模式
- [ ] 协作功能
- [ ] 高级分析dashboard

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

该项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请联系：
- 项目维护者: Eufy GEO Team
- 邮箱: geo-support@eufy.com
- 文档: [内部 Wiki](https://wiki.eufy.com/geo)