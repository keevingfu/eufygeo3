# GEO 平台前端架构设计

## 1. 技术栈选型

### 1.1 核心框架
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3+
- **Styling**: Tailwind CSS 3.4 + CSS Modules
- **UI Library**: Ant Design Pro 5 + shadcn/ui
- **State Management**: Zustand 4 + React Query 5
- **Forms**: React Hook Form + Zod
- **Charts**: ECharts 5 + Recharts
- **Editor**: Lexical (Facebook)

### 1.2 开发工具
- **Build Tool**: Turbo
- **Linting**: ESLint + Prettier
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright
- **Git Hooks**: Husky + lint-staged

## 2. 项目结构

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关页面
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/       # 主应用布局
│   │   ├── layout.tsx     # 共享布局
│   │   ├── page.tsx       # 仪表板首页
│   │   ├── keywords/      # 关键词管理
│   │   ├── content/       # 内容管理
│   │   ├── analytics/     # 数据分析
│   │   └── settings/      # 系统设置
│   ├── api/               # API 路由
│   └── layout.tsx         # 根布局
├── components/            # 可复用组件
│   ├── ui/               # 基础 UI 组件
│   ├── features/         # 功能组件
│   └── layouts/          # 布局组件
├── lib/                  # 工具库
│   ├── api/             # API 客户端
│   ├── hooks/           # 自定义 Hooks
│   ├── utils/           # 工具函数
│   └── validations/     # 表单验证
├── services/            # 业务服务
├── stores/              # Zustand stores
├── types/               # TypeScript 类型
└── styles/              # 全局样式
```

## 3. 核心页面设计

### 3.1 仪表板首页

```tsx
// app/(dashboard)/page.tsx
interface DashboardProps {
  // 核心 KPI 卡片
  metrics: {
    aioCoverage: number;
    organicTraffic: number;
    conversionRate: number;
    roi: number;
  };
  
  // 关键词金字塔
  keywordPyramid: {
    p0: { count: number; coverage: number };
    p1: { count: number; coverage: number };
    // ...
  };
  
  // 实时动态
  recentActivities: Activity[];
  
  // 待办事项
  pendingTasks: Task[];
}
```

### 3.2 关键词管理

```tsx
// app/(dashboard)/keywords/page.tsx
interface KeywordManagementProps {
  // 关键词表格
  keywords: Keyword[];
  
  // 筛选器
  filters: {
    priority: KeywordPriority[];
    aioStatus: AIOStatus[];
    searchVolumeRange: [number, number];
  };
  
  // 批量操作
  bulkActions: {
    updatePriority: (ids: string[], priority: KeywordPriority) => void;
    exportData: (format: 'csv' | 'xlsx') => void;
  };
}
```

### 3.3 内容编辑器

```tsx
// components/features/content-editor/ContentEditor.tsx
interface ContentEditorProps {
  content: ContentItem;
  
  // AI 辅助面板
  aiAssistant: {
    suggestions: AISuggestion[];
    optimizationScore: number;
    checklistItems: ChecklistItem[];
  };
  
  // 协作功能
  collaboration: {
    activeUsers: User[];
    comments: Comment[];
  };
  
  // 发布设置
  publishSettings: {
    channels: Channel[];
    scheduledTime?: Date;
  };
}
```

## 4. UI 组件库

### 4.1 设计系统

```tsx
// Design Tokens
const theme = {
  colors: {
    primary: {
      50: '#e6f7ff',
      500: '#1890ff',
      900: '#003a8c',
    },
    success: {
      50: '#f0f9ff',
      500: '#52c41a',
    },
    warning: {
      50: '#fffbe6',
      500: '#faad14',
    },
    error: {
      50: '#fff1f0',
      500: '#ff4d4f',
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  
  typography: {
    heading1: {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 600,
    },
    // ...
  },
};
```

### 4.2 核心组件

#### KPI 卡片组件
```tsx
// components/ui/kpi-card/KPICard.tsx
interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon?: React.ReactNode;
  loading?: boolean;
}
```

#### 关键词表格组件
```tsx
// components/features/keyword-table/KeywordTable.tsx
interface KeywordTableProps {
  data: Keyword[];
  columns: ColumnConfig[];
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  actions?: TableAction[];
  pagination?: PaginationConfig;
}
```

#### 内容卡片组件
```tsx
// components/features/content-card/ContentCard.tsx
interface ContentCardProps {
  content: ContentItem;
  showMetrics?: boolean;
  actions?: CardAction[];
  onClick?: () => void;
}
```

#### AI 助手组件
```tsx
// components/features/ai-assistant/AIAssistant.tsx
interface AIAssistantProps {
  context: 'keyword' | 'content';
  targetId: string;
  position?: 'sidebar' | 'modal';
  features?: AIFeature[];
}
```

## 5. 数据管理

### 5.1 API 客户端

```tsx
// lib/api/client.ts
import { GraphQLClient } from 'graphql-request';

export const gqlClient = new GraphQLClient(
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  {
    credentials: 'include',
    headers: () => ({
      Authorization: `Bearer ${getAccessToken()}`,
    }),
  }
);

// lib/api/keywords.ts
export const keywordApi = {
  list: (filter?: KeywordFilter) => 
    gqlClient.request(GET_KEYWORDS, { filter }),
    
  create: (input: KeywordCreateInput) =>
    gqlClient.request(CREATE_KEYWORD, { input }),
    
  update: (id: string, input: KeywordUpdateInput) =>
    gqlClient.request(UPDATE_KEYWORD, { id, input }),
};
```

### 5.2 状态管理

```tsx
// stores/keyword.store.ts
interface KeywordStore {
  keywords: Keyword[];
  filters: KeywordFilter;
  selectedIds: Set<string>;
  
  // Actions
  setFilters: (filters: KeywordFilter) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
}

export const useKeywordStore = create<KeywordStore>((set) => ({
  keywords: [],
  filters: {},
  selectedIds: new Set(),
  
  setFilters: (filters) => set({ filters }),
  toggleSelection: (id) => set((state) => {
    const newSet = new Set(state.selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return { selectedIds: newSet };
  }),
  clearSelection: () => set({ selectedIds: new Set() }),
}));
```

### 5.3 实时更新

```tsx
// hooks/useRealtimeUpdates.ts
export function useRealtimeUpdates() {
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_ENDPOINT);
    
    ws.on('keywordUpdated', (data) => {
      queryClient.invalidateQueries(['keywords']);
    });
    
    ws.on('contentPublished', (data) => {
      toast.success(`内容 "${data.title}" 已发布`);
    });
    
    return () => ws.close();
  }, []);
}
```

## 6. 路由与导航

### 6.1 路由结构

```tsx
// 路由定义
const routes = {
  dashboard: '/',
  keywords: {
    list: '/keywords',
    detail: (id: string) => `/keywords/${id}`,
    create: '/keywords/new',
  },
  content: {
    list: '/content',
    detail: (id: string) => `/content/${id}`,
    edit: (id: string) => `/content/${id}/edit`,
    create: '/content/new',
  },
  analytics: {
    overview: '/analytics',
    keywords: '/analytics/keywords',
    content: '/analytics/content',
    competitors: '/analytics/competitors',
  },
};
```

### 6.2 导航守卫

```tsx
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 权限检查
  const user = decodeToken(token);
  if (!hasPermission(user, request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/403', request.url));
  }
}
```

## 7. 性能优化

### 7.1 代码分割
```tsx
// 动态导入
const ContentEditor = dynamic(
  () => import('@/components/features/content-editor'),
  { 
    loading: () => <EditorSkeleton />,
    ssr: false 
  }
);
```

### 7.2 图片优化
```tsx
// 使用 Next.js Image 组件
import Image from 'next/image';

<Image
  src={keyword.thumbnail}
  alt={keyword.text}
  width={300}
  height={200}
  placeholder="blur"
  blurDataURL={keyword.blurDataURL}
/>
```

### 7.3 数据预取
```tsx
// 预取下一页数据
export function useKeywordsPrefetch() {
  const queryClient = useQueryClient();
  
  return (page: number) => {
    queryClient.prefetchQuery({
      queryKey: ['keywords', { page }],
      queryFn: () => keywordApi.list({ page }),
    });
  };
}
```

## 8. 测试策略

### 8.1 单元测试
```tsx
// components/ui/kpi-card/KPICard.test.tsx
describe('KPICard', () => {
  it('应该正确显示数值和趋势', () => {
    render(
      <KPICard 
        title="AIO覆盖率"
        value={42.5}
        unit="%"
        trend={{ value: 5.2, direction: 'up' }}
      />
    );
    
    expect(screen.getByText('42.5%')).toBeInTheDocument();
    expect(screen.getByText('+5.2%')).toBeInTheDocument();
  });
});
```

### 8.2 集成测试
```tsx
// app/(dashboard)/keywords/keywords.test.tsx
describe('关键词管理页面', () => {
  it('应该能够筛选和排序关键词', async () => {
    const user = userEvent.setup();
    render(<KeywordsPage />);
    
    await user.selectOptions(screen.getByLabelText('优先级'), 'P0');
    await user.click(screen.getByText('搜索'));
    
    await waitFor(() => {
      expect(screen.getAllByTestId('keyword-row')).toHaveLength(8);
    });
  });
});
```

### 8.3 E2E 测试
```typescript
// e2e/keywords.spec.ts
test('创建新关键词流程', async ({ page }) => {
  await page.goto('/keywords');
  await page.click('text=添加关键词');
  
  await page.fill('[name=text]', 'smart doorbell with ai');
  await page.fill('[name=searchVolume]', '45000');
  await page.selectOption('[name=priority]', 'P0');
  
  await page.click('text=保存');
  
  await expect(page.locator('.ant-message')).toContainText('创建成功');
});
```

## 9. 国际化

### 9.1 配置
```tsx
// lib/i18n/config.ts
export const i18nConfig = {
  defaultLocale: 'zh-CN',
  locales: ['zh-CN', 'en-US'],
  namespaces: ['common', 'keywords', 'content', 'analytics'],
};
```

### 9.2 使用示例
```tsx
// 组件中使用
import { useTranslation } from 'next-i18next';

export function KeywordTable() {
  const { t } = useTranslation('keywords');
  
  return (
    <Table
      columns={[
        { title: t('columns.keyword'), dataIndex: 'text' },
        { title: t('columns.searchVolume'), dataIndex: 'searchVolume' },
        { title: t('columns.priority'), dataIndex: 'priority' },
      ]}
    />
  );
}
```

## 10. 部署配置

### 10.1 环境变量
```env
# .env.production
NEXT_PUBLIC_API_URL=https://api.geo-platform.com
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.geo-platform.com/graphql
NEXT_PUBLIC_WS_ENDPOINT=wss://api.geo-platform.com/ws
```

### 10.2 构建优化
```javascript
// next.config.js
module.exports = {
  output: 'standalone',
  images: {
    domains: ['cdn.geo-platform.com'],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['antd', 'echarts'],
  },
};