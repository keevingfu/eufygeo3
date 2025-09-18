# PRP: 关键词管理系统

*Generated using Context Engineering methodology for one-pass implementation*

## 🎯 实施目标

构建一个智能化的关键词管理系统，支持 850+ 关键词的 P0-P4 分层管理、AIO 状态监测和竞争分析。

## 📋 详细需求规范

### 核心功能需求

#### 1. 关键词数据管理
```typescript
// 数据结构定义
interface Keyword {
  id: string;
  text: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  aioStatus: 'yes' | 'no' | 'monitoring' | 'not_monitored';
  competitorData: CompetitorData[];
  metrics: KeywordMetric[];
}

interface CompetitorData {
  domain: string;
  position: number;
  trafficShare: number;
  aioAppearance: boolean;
}
```

#### 2. 批量导入功能
- **支持格式**: CSV, Excel (.xlsx), JSON
- **映射配置**: 用户可自定义字段映射
- **数据验证**: 实时验证和错误提示
- **进度显示**: 批量导入进度条
- **错误处理**: 失败记录导出和重新导入

#### 3. 智能分层算法
```python
# 分层算法伪代码
def classify_keyword(keyword):
    score = 0
    
    # 搜索量权重 (40%)
    if keyword.search_volume >= 30000:
        score += 40
    elif keyword.search_volume >= 15000:
        score += 30
    elif keyword.search_volume >= 10000:
        score += 20
    elif keyword.search_volume >= 5000:
        score += 10
    
    # 商业价值权重 (30%)
    commercial_intent_score = analyze_commercial_intent(keyword.text)
    score += commercial_intent_score * 0.3
    
    # 竞争难度权重 (20%)
    if keyword.difficulty < 30:
        score += 20
    elif keyword.difficulty < 50:
        score += 15
    elif keyword.difficulty < 70:
        score += 10
    
    # AIO 潜力权重 (10%)
    aio_potential = predict_aio_potential(keyword.text)
    score += aio_potential * 0.1
    
    return assign_priority_level(score)
```

#### 4. AIO 状态监测
- **实时检测**: 每日检查关键词的 AIO 展示状态
- **历史追踪**: AIO 出现/消失时间记录
- **竞争分析**: 分析哪些竞争对手出现在 AIO 中
- **机会识别**: 发现新的 AIO 机会词

### 技术实现规范

#### 后端实现 (NestJS)

```typescript
// keyword.service.ts
@Injectable()
export class KeywordService {
  constructor(
    private prisma: PrismaService,
    private neo4jService: Neo4jService,
    private aiService: AIService,
  ) {}

  async importKeywords(file: Express.Multer.File, mapping: FieldMapping) {
    // 1. 解析文件
    const data = await this.parseFile(file);
    
    // 2. 数据验证
    const validationResults = await this.validateKeywords(data);
    
    // 3. 批量创建
    const keywords = await this.prisma.$transaction(async (tx) => {
      return Promise.all(
        validationResults.valid.map(keyword => 
          tx.keyword.create({ data: keyword })
        )
      );
    });
    
    // 4. 同步到 Neo4j
    await this.syncToNeo4j(keywords);
    
    // 5. 触发分层算法
    await this.triggerClassification(keywords.map(k => k.id));
    
    return {
      success: keywords.length,
      failed: validationResults.invalid.length,
      errors: validationResults.errors
    };
  }

  async classifyKeywords(keywordIds: string[]) {
    const keywords = await this.prisma.keyword.findMany({
      where: { id: { in: keywordIds } }
    });

    const updates = await Promise.all(
      keywords.map(async (keyword) => {
        const priority = await this.aiService.classifyKeyword(keyword);
        return this.prisma.keyword.update({
          where: { id: keyword.id },
          data: { priorityLevel: priority }
        });
      })
    );

    return updates;
  }

  async monitorAIOStatus() {
    const keywords = await this.prisma.keyword.findMany({
      where: { aioStatus: { in: ['monitoring', 'yes'] } }
    });

    const results = await Promise.all(
      keywords.map(async (keyword) => {
        const aioStatus = await this.checkAIOStatus(keyword.text);
        
        if (aioStatus !== keyword.aioStatus) {
          await this.prisma.keyword.update({
            where: { id: keyword.id },
            data: { 
              aioStatus,
              aioFirstSeenAt: aioStatus === 'yes' ? new Date() : keyword.aioFirstSeenAt
            }
          });
          
          // 发送通知
          await this.notificationService.sendAIOStatusChange(keyword, aioStatus);
        }
        
        return { keyword: keyword.id, status: aioStatus };
      })
    );

    return results;
  }
}
```

#### 前端实现 (Next.js + Ant Design)

```tsx
// KeywordManagementPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Upload, Select, Tag, Space, Drawer, Modal } from 'antd';
import { PlusOutlined, UploadOutlined, FilterOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@apollo/client';
import { GET_KEYWORDS, IMPORT_KEYWORDS, UPDATE_KEYWORD_PRIORITY } from '@/lib/graphql/keywords';

export default function KeywordManagementPage() {
  const [filters, setFilters] = useState({
    priority: [],
    aioStatus: [],
    searchVolumeRange: [0, 100000]
  });
  
  const { data, loading, refetch } = useQuery(GET_KEYWORDS, {
    variables: { filter: filters }
  });

  const [importKeywords] = useMutation(IMPORT_KEYWORDS);
  const [updatePriority] = useMutation(UPDATE_KEYWORD_PRIORITY);

  const columns = [
    {
      title: '关键词',
      dataIndex: 'text',
      key: 'text',
      width: 200,
      ellipsis: true,
    },
    {
      title: '搜索量',
      dataIndex: 'searchVolume',
      key: 'searchVolume',
      width: 100,
      render: (value: number) => value?.toLocaleString() || '-',
      sorter: true,
    },
    {
      title: '优先级',
      dataIndex: 'priorityLevel',
      key: 'priorityLevel',
      width: 80,
      render: (priority: string) => {
        const colors = {
          P0: 'red',
          P1: 'orange', 
          P2: 'gold',
          P3: 'blue',
          P4: 'default'
        };
        return <Tag color={colors[priority]}>{priority}</Tag>;
      },
    },
    {
      title: 'AIO状态',
      dataIndex: 'aioStatus',
      key: 'aioStatus',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          yes: { color: 'green', text: '已显示' },
          no: { color: 'red', text: '未显示' },
          monitoring: { color: 'blue', text: '监测中' },
          not_monitored: { color: 'default', text: '未监测' }
        };
        const config = statusConfig[status] || statusConfig.not_monitored;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '竞争难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (difficulty: number) => {
        let color = 'green';
        if (difficulty > 70) color = 'red';
        else if (difficulty > 50) color = 'orange';
        else if (difficulty > 30) color = 'gold';
        
        return <Tag color={color}>{difficulty || '-'}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => viewDetails(record.id)}>
            详情
          </Button>
          <Button size="small" onClick={() => editKeyword(record.id)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const result = await importKeywords({
        variables: { file: formData }
      });
      
      message.success(`成功导入 ${result.data.importKeywords.success} 个关键词`);
      refetch();
    } catch (error) {
      message.error('导入失败：' + error.message);
    }
  };

  const handleBulkPriorityUpdate = async (selectedIds: string[], newPriority: string) => {
    try {
      await updatePriority({
        variables: { ids: selectedIds, priority: newPriority }
      });
      
      message.success('优先级更新成功');
      refetch();
    } catch (error) {
      message.error('更新失败：' + error.message);
    }
  };

  return (
    <div className="keyword-management">
      <div className="page-header">
        <h1>关键词管理</h1>
        <Space>
          <Upload 
            beforeUpload={handleImport}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>
              导入关键词
            </Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />}>
            添加关键词
          </Button>
        </Space>
      </div>

      <div className="filters-section">
        <Space wrap>
          <Select
            mode="multiple"
            placeholder="优先级筛选"
            style={{ width: 200 }}
            value={filters.priority}
            onChange={(value) => setFilters({...filters, priority: value})}
          >
            <Select.Option value="P0">P0</Select.Option>
            <Select.Option value="P1">P1</Select.Option>
            <Select.Option value="P2">P2</Select.Option>
            <Select.Option value="P3">P3</Select.Option>
            <Select.Option value="P4">P4</Select.Option>
          </Select>
          
          <Select
            mode="multiple"
            placeholder="AIO状态筛选"
            style={{ width: 200 }}
            value={filters.aioStatus}
            onChange={(value) => setFilters({...filters, aioStatus: value})}
          >
            <Select.Option value="yes">已显示</Select.Option>
            <Select.Option value="no">未显示</Select.Option>
            <Select.Option value="monitoring">监测中</Select.Option>
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data?.keywords?.edges?.map(edge => edge.node) || []}
        loading={loading}
        rowKey="id"
        rowSelection={{
          type: 'checkbox',
          onChange: (selectedRowKeys) => {
            setSelectedKeys(selectedRowKeys);
          },
        }}
        pagination={{
          total: data?.keywords?.pageInfo?.totalCount,
          pageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 1000 }}
      />
    </div>
  );
}
```

### 质量保证清单

#### 功能测试
- [ ] 关键词导入功能测试 (CSV, Excel, JSON)
- [ ] 分层算法准确性测试
- [ ] AIO 状态监测功能测试
- [ ] 批量操作功能测试
- [ ] 筛选和搜索功能测试

#### 性能测试
- [ ] 大批量导入性能测试 (1000+ 关键词)
- [ ] 并发用户访问测试
- [ ] 数据库查询性能优化
- [ ] 前端渲染性能测试

#### 安全测试
- [ ] 文件上传安全验证
- [ ] SQL 注入防护测试
- [ ] 权限控制测试
- [ ] 数据加密验证

### 成功验收标准

1. **功能完整性**: 所有需求功能 100% 实现
2. **性能指标**: 
   - 导入 1000 个关键词 < 30秒
   - 页面加载时间 < 2秒
   - API 响应时间 < 200ms
3. **准确性**: 分层算法准确率 > 90%
4. **稳定性**: 连续运行 72 小时无崩溃
5. **用户体验**: SUS 可用性评分 > 80分

### 部署配置

```yaml
# docker-compose.keyword-service.yml
version: '3.8'
services:
  keyword-service:
    build: ./backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEO4J_URI=${NEO4J_URI}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - neo4j
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

*此 PRP 文档确保关键词管理系统的一次性成功实现，包含完整的技术规范、测试计划和验收标准。*