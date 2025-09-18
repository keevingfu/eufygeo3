import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Keyword,
  KeywordFilter,
  KeywordSort,
  KeywordConnection,
  BulkActionInput,
  LoadingState,
  KeywordSortField,
  SortDirection,
} from '@/types/keyword';

interface KeywordState {
  // 数据状态
  keywords: Keyword[];
  connection: KeywordConnection | null;
  selectedKeywords: string[];
  currentKeyword: Keyword | null;
  
  // 查询状态
  filter: KeywordFilter;
  sort: KeywordSort;
  currentPage: number;
  pageSize: number;
  
  // UI 状态
  loading: LoadingState;
  isTableLoading: boolean;
  isExporting: boolean;
  isBulkActionLoading: boolean;
  
  // 视图状态
  viewMode: 'table' | 'grid' | 'tree';
  showFilters: boolean;
  showMetrics: boolean;
  
  // Actions
  setKeywords: (keywords: Keyword[]) => void;
  setConnection: (connection: KeywordConnection) => void;
  addKeyword: (keyword: Keyword) => void;
  updateKeyword: (id: string, updates: Partial<Keyword>) => void;
  deleteKeyword: (id: string) => void;
  setCurrentKeyword: (keyword: Keyword | null) => void;
  
  // 选择相关
  setSelectedKeywords: (ids: string[]) => void;
  toggleKeywordSelection: (id: string) => void;
  selectAllKeywords: () => void;
  clearSelection: () => void;
  
  // 筛选和排序
  setFilter: (filter: Partial<KeywordFilter>) => void;
  clearFilter: () => void;
  setSort: (sort: KeywordSort) => void;
  setPagination: (page: number, pageSize?: number) => void;
  
  // 加载状态
  setLoading: (loading: Partial<LoadingState>) => void;
  setTableLoading: (loading: boolean) => void;
  setExporting: (loading: boolean) => void;
  setBulkActionLoading: (loading: boolean) => void;
  
  // 视图状态
  setViewMode: (mode: 'table' | 'grid' | 'tree') => void;
  toggleFilters: () => void;
  toggleMetrics: () => void;
  
  // 批量操作
  executeBulkAction: (action: BulkActionInput) => Promise<void>;
  
  // 重置状态
  reset: () => void;
}

const initialFilter: KeywordFilter = {};

const initialSort: KeywordSort = {
  field: KeywordSortField.UPDATED_AT,
  direction: SortDirection.DESC,
};

const initialLoading: LoadingState = {
  isLoading: false,
  error: undefined,
};

export const useKeywordStore = create<KeywordState>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      keywords: [],
      connection: null,
      selectedKeywords: [],
      currentKeyword: null,
      
      filter: initialFilter,
      sort: initialSort,
      currentPage: 1,
      pageSize: 20,
      
      loading: initialLoading,
      isTableLoading: false,
      isExporting: false,
      isBulkActionLoading: false,
      
      viewMode: 'table',
      showFilters: false,
      showMetrics: true,
      
      // Actions
      setKeywords: (keywords) =>
        set((state) => {
          state.keywords = keywords;
        }),
      
      setConnection: (connection) =>
        set((state) => {
          state.connection = connection;
          if (connection) {
            state.keywords = connection.edges.map((edge) => edge.node);
          }
        }),
      
      addKeyword: (keyword) =>
        set((state) => {
          state.keywords.unshift(keyword);
        }),
      
      updateKeyword: (id, updates) =>
        set((state) => {
          const index = state.keywords.findIndex((k) => k.id === id);
          if (index !== -1) {
            state.keywords[index] = { ...state.keywords[index], ...updates };
          }
          
          // 更新当前关键词
          if (state.currentKeyword?.id === id) {
            state.currentKeyword = { ...state.currentKeyword, ...updates };
          }
        }),
      
      deleteKeyword: (id) =>
        set((state) => {
          state.keywords = state.keywords.filter((k) => k.id !== id);
          state.selectedKeywords = state.selectedKeywords.filter((kid) => kid !== id);
          
          if (state.currentKeyword?.id === id) {
            state.currentKeyword = null;
          }
        }),
      
      setCurrentKeyword: (keyword) =>
        set((state) => {
          state.currentKeyword = keyword;
        }),
      
      // 选择相关
      setSelectedKeywords: (ids) =>
        set((state) => {
          state.selectedKeywords = ids;
        }),
      
      toggleKeywordSelection: (id) =>
        set((state) => {
          const index = state.selectedKeywords.indexOf(id);
          if (index === -1) {
            state.selectedKeywords.push(id);
          } else {
            state.selectedKeywords.splice(index, 1);
          }
        }),
      
      selectAllKeywords: () =>
        set((state) => {
          state.selectedKeywords = state.keywords.map((k) => k.id);
        }),
      
      clearSelection: () =>
        set((state) => {
          state.selectedKeywords = [];
        }),
      
      // 筛选和排序
      setFilter: (filter) =>
        set((state) => {
          state.filter = { ...state.filter, ...filter };
          state.currentPage = 1; // 重置到第一页
        }),
      
      clearFilter: () =>
        set((state) => {
          state.filter = initialFilter;
          state.currentPage = 1;
        }),
      
      setSort: (sort) =>
        set((state) => {
          state.sort = sort;
          state.currentPage = 1; // 重置到第一页
        }),
      
      setPagination: (page, pageSize) =>
        set((state) => {
          state.currentPage = page;
          if (pageSize !== undefined) {
            state.pageSize = pageSize;
          }
        }),
      
      // 加载状态
      setLoading: (loading) =>
        set((state) => {
          state.loading = { ...state.loading, ...loading };
        }),
      
      setTableLoading: (loading) =>
        set((state) => {
          state.isTableLoading = loading;
        }),
      
      setExporting: (loading) =>
        set((state) => {
          state.isExporting = loading;
        }),
      
      setBulkActionLoading: (loading) =>
        set((state) => {
          state.isBulkActionLoading = loading;
        }),
      
      // 视图状态
      setViewMode: (mode) =>
        set((state) => {
          state.viewMode = mode;
        }),
      
      toggleFilters: () =>
        set((state) => {
          state.showFilters = !state.showFilters;
        }),
      
      toggleMetrics: () =>
        set((state) => {
          state.showMetrics = !state.showMetrics;
        }),
      
      // 批量操作
      executeBulkAction: async (action) => {
        const { setBulkActionLoading } = get();
        
        try {
          setBulkActionLoading(true);
          
          // 这里应该调用 GraphQL mutation
          // 暂时模拟操作
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          // 根据操作类型更新状态
          switch (action.type) {
            case 'DELETE':
              set((state) => {
                state.keywords = state.keywords.filter(
                  (k) => !action.keywordIds.includes(k.id)
                );
                state.selectedKeywords = [];
              });
              break;
            
            case 'UPDATE_STATUS':
            case 'UPDATE_PRIORITY':
            case 'UPDATE_AIO_STATUS':
              set((state) => {
                action.keywordIds.forEach((id) => {
                  const index = state.keywords.findIndex((k) => k.id === id);
                  if (index !== -1) {
                    const fieldMap = {
                      UPDATE_STATUS: 'status',
                      UPDATE_PRIORITY: 'priority',
                      UPDATE_AIO_STATUS: 'aioStatus',
                    };
                    const field = fieldMap[action.type];
                    if (field) {
                      (state.keywords[index] as any)[field] = action.value;
                    }
                  }
                });
                state.selectedKeywords = [];
              });
              break;
          }
        } catch (error) {
          console.error('Bulk action failed:', error);
          throw error;
        } finally {
          setBulkActionLoading(false);
        }
      },
      
      // 重置状态
      reset: () =>
        set((state) => {
          state.keywords = [];
          state.connection = null;
          state.selectedKeywords = [];
          state.currentKeyword = null;
          state.filter = initialFilter;
          state.sort = initialSort;
          state.currentPage = 1;
          state.pageSize = 20;
          state.loading = initialLoading;
          state.isTableLoading = false;
          state.isExporting = false;
          state.isBulkActionLoading = false;
          state.viewMode = 'table';
          state.showFilters = false;
          state.showMetrics = true;
        }),
    })),
    {
      name: 'keyword-store',
      partialize: (state) => ({
        // 只持久化部分状态
        filter: state.filter,
        sort: state.sort,
        pageSize: state.pageSize,
        viewMode: state.viewMode,
        showFilters: state.showFilters,
        showMetrics: state.showMetrics,
      }),
    }
  )
);

// 选择器
export const useKeywordList = () => useKeywordStore((state) => state.keywords);
export const useSelectedKeywords = () => useKeywordStore((state) => state.selectedKeywords);
export const useCurrentKeyword = () => useKeywordStore((state) => state.currentKeyword);
export const useKeywordFilter = () => useKeywordStore((state) => state.filter);
export const useKeywordSort = () => useKeywordStore((state) => state.sort);
export const useKeywordPagination = () => useKeywordStore((state) => ({
  currentPage: state.currentPage,
  pageSize: state.pageSize,
  total: state.connection?.pageInfo.totalCount || 0,
}));
export const useKeywordLoading = () => useKeywordStore((state) => ({
  loading: state.loading,
  isTableLoading: state.isTableLoading,
  isExporting: state.isExporting,
  isBulkActionLoading: state.isBulkActionLoading,
}));
export const useKeywordViewState = () => useKeywordStore((state) => ({
  viewMode: state.viewMode,
  showFilters: state.showFilters,
  showMetrics: state.showMetrics,
}));