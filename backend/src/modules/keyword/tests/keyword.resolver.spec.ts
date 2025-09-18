/**
 * 关键词解析器单元测试
 * 
 * @description 测试 KeywordResolver 的所有 GraphQL 操作
 * @author AI Assistant
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { KeywordResolver } from '../resolvers/keyword.resolver';
import { KeywordService } from '../services/keyword.service';
import { KeywordLoaderService } from '../loaders/keyword.loader';
import {
  KeywordPriorityLevel,
  KeywordCompetitionLevel,
  KeywordIntentType,
  ProductLine,
  MarketingFunnelStage,
  AIOStatus,
  KeywordStatus,
} from '../types/keyword.types';
import {
  CreateKeywordInputDto,
  UpdateKeywordInputDto,
  KeywordQueryInputDto,
  BulkUpdateKeywordsInputDto,
  AIOMonitoringInputDto,
} from '../dto/keyword.dto';

describe('KeywordResolver', () => {
  let resolver: KeywordResolver;
  let keywordService: KeywordService;
  let loaderService: KeywordLoaderService;

  // 测试数据
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    roleId: 'role-admin',
    permissions: ['keyword:read', 'keyword:write', 'keyword:delete'],
  };

  const mockKeyword = {
    id: 'keyword-123',
    text: 'smart camera',
    searchVolume: 5000,
    difficulty: 45.5,
    cpc: 2.50,
    competitionLevel: KeywordCompetitionLevel.MEDIUM,
    priorityLevel: KeywordPriorityLevel.P1,
    intentType: KeywordIntentType.COMMERCIAL,
    productLine: ProductLine.CAMERA,
    stage: MarketingFunnelStage.MOFU,
    aioStatus: AIOStatus.NOT_MONITORED,
    aioFirstSeenAt: null,
    aioCoverageScore: null,
    status: KeywordStatus.ACTIVE,
    assignedTo: null,
    createdBy: mockUser.id,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    assignee: null,
    creator: {
      id: mockUser.id,
      username: 'testuser',
      fullName: 'Test User',
    },
    metrics: [],
    contentItems: [],
    tasks: [],
  };

  const mockContext = {
    req: { user: mockUser },
    loaders: {} as KeywordLoaderService,
  };

  // Mock services
  const mockKeywordService = {
    createKeyword: jest.fn(),
    getKeywordById: jest.fn(),
    updateKeyword: jest.fn(),
    deleteKeyword: jest.fn(),
    getKeywords: jest.fn(),
    searchKeywords: jest.fn(),
    bulkUpdateKeywords: jest.fn(),
    addAIOMonitoring: jest.fn(),
    getAIOStats: jest.fn(),
  };

  const mockLoaderService = {
    getKeywordLoader: jest.fn(),
    getUserLoader: jest.fn(),
    getKeywordMetricsLoader: jest.fn(),
    getLatestKeywordMetricsLoader: jest.fn(),
    getKeywordContentItemsLoader: jest.fn(),
    getKeywordTasksLoader: jest.fn(),
    getKeywordStatsLoader: jest.fn(),
    clearAllCaches: jest.fn(),
    clearKeywordCache: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeywordResolver,
        {
          provide: KeywordService,
          useValue: mockKeywordService,
        },
        {
          provide: KeywordLoaderService,
          useValue: mockLoaderService,
        },
      ],
    }).compile();

    resolver = module.get<KeywordResolver>(KeywordResolver);
    keywordService = module.get<KeywordService>(KeywordService);
    loaderService = module.get<KeywordLoaderService>(KeywordLoaderService);

    // 设置 context loaders
    mockContext.loaders = loaderService;

    // 重置所有 mock
    jest.clearAllMocks();
  });

  describe('Query: getKeyword', () => {
    it('should return keyword by ID', async () => {
      // Arrange
      const keywordLoader = {
        load: jest.fn().mockResolvedValue(mockKeyword),
      };
      mockLoaderService.getKeywordLoader.mockReturnValue(keywordLoader);

      // Act
      const result = await resolver.getKeyword(mockKeyword.id, mockContext);

      // Assert
      expect(result).toEqual(mockKeyword);
      expect(keywordLoader.load).toHaveBeenCalledWith(mockKeyword.id);
    });

    it('should throw error when keyword not found', async () => {
      // Arrange
      const keywordLoader = {
        load: jest.fn().mockResolvedValue(null),
      };
      mockLoaderService.getKeywordLoader.mockReturnValue(keywordLoader);

      // Act & Assert
      await expect(
        resolver.getKeyword('nonexistent-id', mockContext)
      ).rejects.toThrow(`关键词不存在: nonexistent-id`);
    });
  });

  describe('Query: getKeywords', () => {
    const mockPaginatedResult = {
      data: [mockKeyword],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    it('should return paginated keywords', async () => {
      // Arrange
      const queryInput: KeywordQueryInputDto = {
        filters: {
          text: 'camera',
          priorityLevels: [KeywordPriorityLevel.P1],
        },
        pagination: {
          page: 1,
          limit: 20,
        },
      };

      mockKeywordService.getKeywords.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await resolver.getKeywords(queryInput, mockUser);

      // Assert
      expect(result).toEqual({
        data: mockPaginatedResult.data,
        pagination: {
          total: mockPaginatedResult.total,
          page: mockPaginatedResult.page,
          limit: mockPaginatedResult.limit,
          totalPages: mockPaginatedResult.totalPages,
          hasNextPage: mockPaginatedResult.hasNextPage,
          hasPreviousPage: mockPaginatedResult.hasPreviousPage,
        },
      });

      expect(mockKeywordService.getKeywords).toHaveBeenCalledWith({
        filters: queryInput.filters,
        sort: [{ field: 'createdAt', direction: 'desc' }],
        pagination: queryInput.pagination,
        includeRelations: {
          assignee: true,
          creator: true,
          metrics: false,
          contentItems: false,
          tasks: false,
        },
      });
    });

    it('should use default values when no input provided', async () => {
      // Arrange
      mockKeywordService.getKeywords.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await resolver.getKeywords(undefined, mockUser);

      // Assert
      expect(mockKeywordService.getKeywords).toHaveBeenCalledWith({
        filters: {},
        sort: [{ field: 'createdAt', direction: 'desc' }],
        pagination: { page: 1, limit: 20 },
        includeRelations: {
          assignee: true,
          creator: true,
          metrics: false,
          contentItems: false,
          tasks: false,
        },
      });
    });
  });

  describe('Query: searchKeywords', () => {
    it('should search keywords by text', async () => {
      // Arrange
      const query = 'smart camera';
      const searchResults = [mockKeyword];
      mockKeywordService.searchKeywords.mockResolvedValue(searchResults);

      // Act
      const result = await resolver.searchKeywords(query, 10);

      // Assert
      expect(result).toEqual(searchResults);
      expect(mockKeywordService.searchKeywords).toHaveBeenCalledWith(query, 10);
    });

    it('should use default limit when not provided', async () => {
      // Arrange
      const query = 'camera';
      mockKeywordService.searchKeywords.mockResolvedValue([]);

      // Act
      await resolver.searchKeywords(query);

      // Assert
      expect(mockKeywordService.searchKeywords).toHaveBeenCalledWith(query, 10);
    });
  });

  describe('Query: getAIOStats', () => {
    it('should return AIO statistics', async () => {
      // Arrange
      const mockStats = {
        totalMonitored: 100,
        totalDisplayed: 60,
        displayRate: 60.0,
        averagePosition: 2.5,
        coverageByPriority: {
          P0: { monitored: 20, displayed: 15, rate: 75.0 },
          P1: { monitored: 30, displayed: 20, rate: 66.67 },
          P2: { monitored: 25, displayed: 15, rate: 60.0 },
          P3: { monitored: 15, displayed: 8, rate: 53.33 },
          P4: { monitored: 10, displayed: 2, rate: 20.0 },
        },
      };

      mockKeywordService.getAIOStats.mockResolvedValue(mockStats);

      // Act
      const result = await resolver.getAIOStats();

      // Assert
      expect(result).toEqual({
        totalMonitored: mockStats.totalMonitored,
        totalDisplayed: mockStats.totalDisplayed,
        displayRate: mockStats.displayRate,
        averagePosition: mockStats.averagePosition,
        p0Stats: mockStats.coverageByPriority.P0,
        p1Stats: mockStats.coverageByPriority.P1,
        p2Stats: mockStats.coverageByPriority.P2,
        p3Stats: mockStats.coverageByPriority.P3,
        p4Stats: mockStats.coverageByPriority.P4,
      });
    });
  });

  describe('Mutation: createKeyword', () => {
    it('should create keyword successfully', async () => {
      // Arrange
      const createInput: CreateKeywordInputDto = {
        text: 'smart camera',
        searchVolume: 5000,
        difficulty: 45.5,
        cpc: 2.50,
        competitionLevel: KeywordCompetitionLevel.MEDIUM,
        priorityLevel: KeywordPriorityLevel.P1,
        intentType: KeywordIntentType.COMMERCIAL,
        productLine: ProductLine.CAMERA,
        stage: MarketingFunnelStage.MOFU,
      };

      mockKeywordService.createKeyword.mockResolvedValue(mockKeyword);

      // Act
      const result = await resolver.createKeyword(createInput, mockUser);

      // Assert
      expect(result).toEqual(mockKeyword);
      expect(mockKeywordService.createKeyword).toHaveBeenCalledWith(
        createInput,
        mockUser.id
      );
      expect(mockLoaderService.clearAllCaches).toHaveBeenCalled();
    });
  });

  describe('Mutation: updateKeyword', () => {
    it('should update keyword successfully', async () => {
      // Arrange
      const updateInput: UpdateKeywordInputDto = {
        id: mockKeyword.id,
        text: 'updated smart camera',
        priorityLevel: KeywordPriorityLevel.P0,
      };

      const updatedKeyword = {
        ...mockKeyword,
        ...updateInput,
      };

      mockKeywordService.updateKeyword.mockResolvedValue(updatedKeyword);

      // Act
      const result = await resolver.updateKeyword(updateInput, mockUser);

      // Assert
      expect(result).toEqual(updatedKeyword);
      expect(mockKeywordService.updateKeyword).toHaveBeenCalledWith(
        updateInput,
        mockUser.id
      );
      expect(mockLoaderService.clearKeywordCache).toHaveBeenCalledWith(
        updateInput.id
      );
    });
  });

  describe('Mutation: deleteKeyword', () => {
    it('should delete keyword successfully', async () => {
      // Arrange
      mockKeywordService.deleteKeyword.mockResolvedValue(true);

      // Act
      const result = await resolver.deleteKeyword(mockKeyword.id, mockUser);

      // Assert
      expect(result).toBe(true);
      expect(mockKeywordService.deleteKeyword).toHaveBeenCalledWith(
        mockKeyword.id
      );
      expect(mockLoaderService.clearKeywordCache).toHaveBeenCalledWith(
        mockKeyword.id
      );
    });
  });

  describe('Mutation: bulkUpdateKeywords', () => {
    it('should update multiple keywords successfully', async () => {
      // Arrange
      const bulkInput: BulkUpdateKeywordsInputDto = {
        keywordIds: ['keyword-1', 'keyword-2'],
        priorityLevel: KeywordPriorityLevel.P0,
        status: KeywordStatus.ACTIVE,
      };

      const bulkResult = {
        success: true,
        updatedCount: 2,
        errors: [],
      };

      mockKeywordService.bulkUpdateKeywords.mockResolvedValue(bulkResult);

      // Act
      const result = await resolver.bulkUpdateKeywords(bulkInput, mockUser);

      // Assert
      expect(result).toEqual(bulkResult);
      expect(mockKeywordService.bulkUpdateKeywords).toHaveBeenCalledWith(
        bulkInput
      );
      expect(mockLoaderService.clearAllCaches).toHaveBeenCalled();
    });
  });

  describe('Mutation: addAIOMonitoring', () => {
    it('should add AIO monitoring data successfully', async () => {
      // Arrange
      const aioInput: AIOMonitoringInputDto = {
        keywordId: mockKeyword.id,
        aioDisplayed: true,
        aioPosition: 1,
        aioContentSnippet: 'AI overview content',
        metricDate: new Date('2024-01-15T00:00:00Z'),
      };

      mockKeywordService.addAIOMonitoring.mockResolvedValue(true);

      // Act
      const result = await resolver.addAIOMonitoring(aioInput, mockUser);

      // Assert
      expect(result).toBe(true);
      expect(mockKeywordService.addAIOMonitoring).toHaveBeenCalledWith(
        aioInput
      );
      expect(mockLoaderService.clearKeywordCache).toHaveBeenCalledWith(
        aioInput.keywordId
      );
    });
  });

  describe('Field Resolvers', () => {
    describe('resolveAssignee', () => {
      it('should return assignee when keyword has assignedTo', async () => {
        // Arrange
        const keywordWithAssignee = {
          ...mockKeyword,
          assignedTo: 'assignee-123',
        };

        const assigneeUser = {
          id: 'assignee-123',
          username: 'assignee',
          fullName: 'Assignee User',
        };

        const userLoader = {
          load: jest.fn().mockResolvedValue(assigneeUser),
        };
        mockLoaderService.getUserLoader.mockReturnValue(userLoader);

        // Act
        const result = await resolver.resolveAssignee(
          keywordWithAssignee,
          mockContext
        );

        // Assert
        expect(result).toEqual({
          id: assigneeUser.id,
          username: assigneeUser.username,
          fullName: assigneeUser.fullName,
        });
        expect(userLoader.load).toHaveBeenCalledWith('assignee-123');
      });

      it('should return null when keyword has no assignedTo', async () => {
        // Act
        const result = await resolver.resolveAssignee(mockKeyword, mockContext);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('resolveCreator', () => {
      it('should return creator information', async () => {
        // Arrange
        const creatorUser = {
          id: mockUser.id,
          username: 'testuser',
          fullName: 'Test User',
        };

        const userLoader = {
          load: jest.fn().mockResolvedValue(creatorUser),
        };
        mockLoaderService.getUserLoader.mockReturnValue(userLoader);

        // Act
        const result = await resolver.resolveCreator(mockKeyword, mockContext);

        // Assert
        expect(result).toEqual({
          id: creatorUser.id,
          username: creatorUser.username,
          fullName: creatorUser.fullName,
        });
        expect(userLoader.load).toHaveBeenCalledWith(mockKeyword.createdBy);
      });

      it('should throw error when creator not found', async () => {
        // Arrange
        const userLoader = {
          load: jest.fn().mockResolvedValue(null),
        };
        mockLoaderService.getUserLoader.mockReturnValue(userLoader);

        // Act & Assert
        await expect(
          resolver.resolveCreator(mockKeyword, mockContext)
        ).rejects.toThrow(`创建者不存在: ${mockKeyword.createdBy}`);
      });
    });

    describe('resolveMetrics', () => {
      it('should return keyword metrics with limit', async () => {
        // Arrange
        const mockMetrics = [
          {
            id: 'metric-1',
            keywordId: mockKeyword.id,
            metricDate: new Date('2024-01-15'),
            googlePosition: 3,
            aioDisplayed: true,
          },
          {
            id: 'metric-2',
            keywordId: mockKeyword.id,
            metricDate: new Date('2024-01-14'),
            googlePosition: 5,
            aioDisplayed: false,
          },
        ];

        const metricsLoader = {
          load: jest.fn().mockResolvedValue(mockMetrics),
        };
        mockLoaderService.getKeywordMetricsLoader.mockReturnValue(metricsLoader);

        // Act
        const result = await resolver.resolveMetrics(
          mockKeyword,
          mockContext,
          10
        );

        // Assert
        expect(result).toEqual(mockMetrics);
        expect(metricsLoader.load).toHaveBeenCalledWith(mockKeyword.id);
      });
    });

    describe('resolveLatestPosition', () => {
      it('should return latest Google position', async () => {
        // Arrange
        const latestMetric = {
          id: 'metric-latest',
          googlePosition: 2,
          metricDate: new Date('2024-01-15'),
        };

        const latestMetricsLoader = {
          load: jest.fn().mockResolvedValue(latestMetric),
        };
        mockLoaderService.getLatestKeywordMetricsLoader.mockReturnValue(
          latestMetricsLoader
        );

        // Act
        const result = await resolver.resolveLatestPosition(
          mockKeyword,
          mockContext
        );

        // Assert
        expect(result).toBe(2);
        expect(latestMetricsLoader.load).toHaveBeenCalledWith(mockKeyword.id);
      });

      it('should return null when no metrics available', async () => {
        // Arrange
        const latestMetricsLoader = {
          load: jest.fn().mockResolvedValue(null),
        };
        mockLoaderService.getLatestKeywordMetricsLoader.mockReturnValue(
          latestMetricsLoader
        );

        // Act
        const result = await resolver.resolveLatestPosition(
          mockKeyword,
          mockContext
        );

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('resolvePerformanceScore', () => {
      it('should calculate performance score', async () => {
        // Arrange
        const mockStats = {
          totalMetrics: 10,
          latestPosition: 3,
          aioDisplayCount: 5,
          organicTrafficTotal: 1500,
        };

        const statsLoader = {
          load: jest.fn().mockResolvedValue(mockStats),
        };
        mockLoaderService.getKeywordStatsLoader.mockReturnValue(statsLoader);

        // Act
        const result = await resolver.resolvePerformanceScore(
          mockKeyword,
          mockContext
        );

        // Assert
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(100);
        expect(statsLoader.load).toHaveBeenCalledWith(mockKeyword.id);
      });
    });

    describe('resolveCompetitionIntensity', () => {
      it('should return competition intensity for high difficulty and volume', async () => {
        // Arrange
        const highCompetitionKeyword = {
          ...mockKeyword,
          difficulty: 85,
          searchVolume: 15000,
        };

        // Act
        const result = await resolver.resolveCompetitionIntensity(
          highCompetitionKeyword
        );

        // Assert
        expect(result).toBe('EXTREME');
      });

      it('should return null when insufficient data', async () => {
        // Arrange
        const keywordWithoutData = {
          ...mockKeyword,
          difficulty: null,
          searchVolume: null,
        };

        // Act
        const result = await resolver.resolveCompetitionIntensity(
          keywordWithoutData
        );

        // Assert
        expect(result).toBeNull();
      });
    });
  });
});