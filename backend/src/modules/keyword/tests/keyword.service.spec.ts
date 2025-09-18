/**
 * 关键词服务单元测试
 * 
 * @description 测试 KeywordService 的所有功能，包括 CRUD 操作、业务逻辑和错误处理
 * @author AI Assistant
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { KeywordService } from '../services/keyword.service';
import { PrismaService } from '@/common/services/prisma.service';
import {
  KeywordPriorityLevel,
  KeywordCompetitionLevel,
  KeywordIntentType,
  ProductLine,
  MarketingFunnelStage,
  AIOStatus,
  KeywordStatus,
  KeywordErrorCode,
} from '../types/keyword.types';

describe('KeywordService', () => {
  let service: KeywordService;
  let prismaService: PrismaService;

  // 测试数据
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    fullName: 'Test User',
  };

  const mockKeyword = {
    id: 'keyword-123',
    text: 'smart camera',
    searchVolume: 5000,
    difficulty: new Prisma.Decimal(45.5),
    cpc: new Prisma.Decimal(2.50),
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
  };

  // Mock PrismaService
  const mockPrismaService = {
    keyword: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    keywordMetric: {
      upsert: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeywordService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<KeywordService>(KeywordService);
    prismaService = module.get<PrismaService>(PrismaService);

    // 重置所有 mock
    jest.clearAllMocks();
  });

  describe('createKeyword', () => {
    const createInput = {
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

    it('should create keyword successfully', async () => {
      // Arrange
      mockPrismaService.keyword.findFirst.mockResolvedValue(null); // 关键词不存在
      mockPrismaService.keyword.create.mockResolvedValue({
        ...mockKeyword,
        assignee: null,
        creator: mockUser,
      });

      // Act
      const result = await service.createKeyword(createInput, mockUser.id);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        text: createInput.text,
        searchVolume: createInput.searchVolume,
        priorityLevel: createInput.priorityLevel,
      }));
      
      expect(mockPrismaService.keyword.findFirst).toHaveBeenCalledWith({
        where: {
          text: {
            equals: createInput.text.trim(),
            mode: 'insensitive',
          },
        },
      });
      
      expect(mockPrismaService.keyword.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          text: createInput.text.trim(),
          searchVolume: createInput.searchVolume,
          difficulty: new Prisma.Decimal(createInput.difficulty),
          cpc: new Prisma.Decimal(createInput.cpc),
          competitionLevel: createInput.competitionLevel,
          priorityLevel: createInput.priorityLevel,
          intentType: createInput.intentType,
          productLine: createInput.productLine,
          stage: createInput.stage,
          createdBy: mockUser.id,
          status: KeywordStatus.ACTIVE,
          aioStatus: AIOStatus.NOT_MONITORED,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw ConflictException when keyword already exists', async () => {
      // Arrange
      mockPrismaService.keyword.findFirst.mockResolvedValue(mockKeyword);

      // Act & Assert
      await expect(
        service.createKeyword(createInput, mockUser.id)
      ).rejects.toThrow(ConflictException);
      
      expect(mockPrismaService.keyword.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when assignee does not exist', async () => {
      // Arrange
      const inputWithAssignee = {
        ...createInput,
        assignedTo: 'nonexistent-user',
      };
      
      mockPrismaService.keyword.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createKeyword(inputWithAssignee, mockUser.id)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle database errors', async () => {
      // Arrange
      mockPrismaService.keyword.findFirst.mockResolvedValue(null);
      mockPrismaService.keyword.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        service.createKeyword(createInput, mockUser.id)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getKeywordById', () => {
    it('should return keyword when found', async () => {
      // Arrange
      mockPrismaService.keyword.findUnique.mockResolvedValue({
        ...mockKeyword,
        assignee: null,
        creator: mockUser,
      });

      // Act
      const result = await service.getKeywordById(mockKeyword.id);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: mockKeyword.id,
        text: mockKeyword.text,
      }));
      
      expect(mockPrismaService.keyword.findUnique).toHaveBeenCalledWith({
        where: { id: mockKeyword.id },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when keyword not found', async () => {
      // Arrange
      mockPrismaService.keyword.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getKeywordById('nonexistent-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateKeyword', () => {
    const updateInput = {
      id: mockKeyword.id,
      text: 'updated smart camera',
      priorityLevel: KeywordPriorityLevel.P0,
    };

    it('should update keyword successfully', async () => {
      // Arrange
      mockPrismaService.keyword.findUnique.mockResolvedValue(mockKeyword);
      mockPrismaService.keyword.findFirst.mockResolvedValue(null); // 没有重复
      mockPrismaService.keyword.update.mockResolvedValue({
        ...mockKeyword,
        ...updateInput,
        assignee: null,
        creator: mockUser,
      });

      // Act
      const result = await service.updateKeyword(updateInput, mockUser.id);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: updateInput.id,
        text: updateInput.text,
        priorityLevel: updateInput.priorityLevel,
      }));
      
      expect(mockPrismaService.keyword.update).toHaveBeenCalledWith({
        where: { id: updateInput.id },
        data: expect.objectContaining({
          text: updateInput.text.trim(),
          priorityLevel: updateInput.priorityLevel,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when keyword not found', async () => {
      // Arrange
      mockPrismaService.keyword.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateKeyword(updateInput, mockUser.id)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when text conflicts with another keyword', async () => {
      // Arrange
      mockPrismaService.keyword.findUnique.mockResolvedValue(mockKeyword);
      mockPrismaService.keyword.findFirst.mockResolvedValue({
        ...mockKeyword,
        id: 'another-keyword-id',
      });

      // Act & Assert
      await expect(
        service.updateKeyword(updateInput, mockUser.id)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteKeyword', () => {
    it('should delete keyword successfully', async () => {
      // Arrange
      mockPrismaService.keyword.findUnique.mockResolvedValue({
        ...mockKeyword,
        contentItems: [],
        tasks: [],
      });
      mockPrismaService.keyword.delete.mockResolvedValue(mockKeyword);

      // Act
      const result = await service.deleteKeyword(mockKeyword.id);

      // Assert
      expect(result).toBe(true);
      expect(mockPrismaService.keyword.delete).toHaveBeenCalledWith({
        where: { id: mockKeyword.id },
      });
    });

    it('should throw NotFoundException when keyword not found', async () => {
      // Arrange
      mockPrismaService.keyword.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteKeyword('nonexistent-id')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when keyword has associated content', async () => {
      // Arrange
      mockPrismaService.keyword.findUnique.mockResolvedValue({
        ...mockKeyword,
        contentItems: [{ id: 'content-1', title: 'Test Content' }],
        tasks: [],
      });

      // Act & Assert
      await expect(
        service.deleteKeyword(mockKeyword.id)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getKeywords', () => {
    const mockKeywords = [
      { ...mockKeyword, assignee: null, creator: mockUser },
      { 
        ...mockKeyword, 
        id: 'keyword-456', 
        text: 'security camera',
        assignee: null,
        creator: mockUser,
      },
    ];

    it('should return paginated keywords', async () => {
      // Arrange
      mockPrismaService.keyword.findMany.mockResolvedValue(mockKeywords);
      mockPrismaService.keyword.count.mockResolvedValue(2);

      // Act
      const result = await service.getKeywords({
        pagination: { page: 1, limit: 10 },
      });

      // Assert
      expect(result).toEqual({
        data: mockKeywords,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const filters = {
        text: 'camera',
        priorityLevel: KeywordPriorityLevel.P1,
        status: KeywordStatus.ACTIVE,
      };
      
      mockPrismaService.keyword.findMany.mockResolvedValue(mockKeywords);
      mockPrismaService.keyword.count.mockResolvedValue(2);

      // Act
      await service.getKeywords({ filters });

      // Assert
      expect(mockPrismaService.keyword.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          text: {
            contains: filters.text,
            mode: 'insensitive',
          },
          priorityLevel: filters.priorityLevel,
          status: filters.status,
        }),
        include: expect.any(Object),
        orderBy: expect.any(Array),
        skip: 0,
        take: 20,
      });
    });
  });

  describe('searchKeywords', () => {
    it('should search keywords by text', async () => {
      // Arrange
      const query = 'camera';
      mockPrismaService.keyword.findMany.mockResolvedValue([mockKeyword]);

      // Act
      const result = await service.searchKeywords(query, 10);

      // Assert
      expect(result).toEqual([mockKeyword]);
      expect(mockPrismaService.keyword.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              text: {
                contains: query.trim(),
                mode: 'insensitive',
              },
            },
            {
              text: {
                search: query.trim().split(' ').join(' & '),
              },
            },
          ],
          status: KeywordStatus.ACTIVE,
        },
        include: expect.any(Object),
        take: 10,
        orderBy: expect.any(Array),
      });
    });

    it('should return empty array for empty query', async () => {
      // Act
      const result = await service.searchKeywords('', 10);

      // Assert
      expect(result).toEqual([]);
      expect(mockPrismaService.keyword.findMany).not.toHaveBeenCalled();
    });
  });

  describe('bulkUpdateKeywords', () => {
    const bulkInput = {
      keywordIds: ['keyword-123', 'keyword-456'],
      priorityLevel: KeywordPriorityLevel.P0,
      status: KeywordStatus.ACTIVE,
    };

    it('should update multiple keywords successfully', async () => {
      // Arrange
      mockPrismaService.keyword.findMany.mockResolvedValue([
        { id: 'keyword-123' },
        { id: 'keyword-456' },
      ]);
      mockPrismaService.keyword.updateMany.mockResolvedValue({ count: 2 });

      // Act
      const result = await service.bulkUpdateKeywords(bulkInput);

      // Assert
      expect(result).toEqual({
        success: true,
        updatedCount: 2,
        errors: [],
      });
      
      expect(mockPrismaService.keyword.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: bulkInput.keywordIds,
          },
        },
        data: {
          priorityLevel: bulkInput.priorityLevel,
          status: bulkInput.status,
        },
      });
    });

    it('should handle missing keywords', async () => {
      // Arrange
      mockPrismaService.keyword.findMany.mockResolvedValue([
        { id: 'keyword-123' },
      ]); // 只找到一个
      mockPrismaService.keyword.updateMany.mockResolvedValue({ count: 1 });

      // Act
      const result = await service.bulkUpdateKeywords(bulkInput);

      // Assert
      expect(result).toEqual({
        success: false,
        updatedCount: 1,
        errors: [
          {
            keywordId: 'keyword-456',
            error: '关键词不存在',
          },
        ],
      });
    });
  });

  describe('addAIOMonitoring', () => {
    const aioInput = {
      keywordId: mockKeyword.id,
      aioDisplayed: true,
      aioPosition: 1,
      aioContentSnippet: 'AI overview content',
      metricDate: new Date('2024-01-15T00:00:00Z'),
    };

    it('should add AIO monitoring data successfully', async () => {
      // Arrange
      mockPrismaService.keyword.findUnique.mockResolvedValue(mockKeyword);
      mockPrismaService.keywordMetric.upsert.mockResolvedValue({
        id: 'metric-123',
        ...aioInput,
      });
      mockPrismaService.keyword.update.mockResolvedValue({
        ...mockKeyword,
        aioStatus: AIOStatus.DISPLAYED,
        aioFirstSeenAt: aioInput.metricDate,
      });

      // Act
      const result = await service.addAIOMonitoring(aioInput);

      // Assert
      expect(result).toBe(true);
      
      expect(mockPrismaService.keywordMetric.upsert).toHaveBeenCalledWith({
        where: {
          keywordId_metricDate: {
            keywordId: aioInput.keywordId,
            metricDate: aioInput.metricDate,
          },
        },
        update: {
          aioDisplayed: aioInput.aioDisplayed,
          aioPosition: aioInput.aioPosition,
          aioContentSnippet: aioInput.aioContentSnippet,
        },
        create: {
          keywordId: aioInput.keywordId,
          metricDate: aioInput.metricDate,
          aioDisplayed: aioInput.aioDisplayed,
          aioPosition: aioInput.aioPosition,
          aioContentSnippet: aioInput.aioContentSnippet,
        },
      });
      
      expect(mockPrismaService.keyword.update).toHaveBeenCalledWith({
        where: { id: aioInput.keywordId },
        data: {
          aioStatus: AIOStatus.DISPLAYED,
          aioFirstSeenAt: aioInput.metricDate,
        },
      });
    });

    it('should throw NotFoundException when keyword not found', async () => {
      // Arrange
      mockPrismaService.keyword.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.addAIOMonitoring(aioInput)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAIOStats', () => {
    it('should return AIO statistics', async () => {
      // Arrange
      const mockTotalStats = [
        { aioStatus: AIOStatus.DISPLAYED, _count: { id: 10 } },
        { aioStatus: AIOStatus.NOT_DISPLAYED, _count: { id: 5 } },
      ];
      
      const mockPriorityStats = [
        { priorityLevel: KeywordPriorityLevel.P0, aioStatus: AIOStatus.DISPLAYED, _count: { id: 3 } },
        { priorityLevel: KeywordPriorityLevel.P1, aioStatus: AIOStatus.DISPLAYED, _count: { id: 4 } },
      ];
      
      const mockAvgPosition = { _avg: { aioPosition: 2.5 } };

      mockPrismaService.keyword.groupBy
        .mockResolvedValueOnce(mockTotalStats)
        .mockResolvedValueOnce(mockPriorityStats);
      mockPrismaService.keywordMetric.aggregate.mockResolvedValue(mockAvgPosition);

      // Act
      const result = await service.getAIOStats();

      // Assert
      expect(result).toEqual(expect.objectContaining({
        totalMonitored: 15,
        totalDisplayed: 10,
        displayRate: expect.closeTo(66.67, 1),
        averagePosition: 2.5,
        coverageByPriority: expect.any(Object),
      }));
    });
  });
});

describe('KeywordService Error Handling', () => {
  let service: KeywordService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeywordService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<KeywordService>(KeywordService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should handle Prisma unique constraint violations', async () => {
    // Arrange
    const prismaError = {
      code: 'P2002',
      meta: {
        target: ['text'],
        target_value: 'duplicate keyword',
      },
    };
    
    mockPrismaService.keyword.findFirst.mockResolvedValue(null);
    mockPrismaService.keyword.create.mockRejectedValue(prismaError);

    // Act & Assert
    await expect(
      service.createKeyword(
        { text: 'duplicate keyword' },
        'user-123'
      )
    ).rejects.toThrow(BadRequestException);
  });

  it('should handle Prisma record not found errors', async () => {
    // Arrange
    const prismaError = {
      code: 'P2025',
      meta: {
        cause: 'Record to update not found.',
      },
    };
    
    mockPrismaService.keyword.findUnique.mockResolvedValue(mockKeyword);
    mockPrismaService.keyword.update.mockRejectedValue(prismaError);

    // Act & Assert
    await expect(
      service.updateKeyword(
        { id: 'nonexistent-id', text: 'updated' },
        'user-123'
      )
    ).rejects.toThrow(BadRequestException);
  });

  it('should handle network timeouts gracefully', async () => {
    // Arrange
    const timeoutError = new Error('Connection timeout');
    mockPrismaService.keyword.findMany.mockRejectedValue(timeoutError);

    // Act & Assert
    await expect(
      service.getKeywords()
    ).rejects.toThrow(BadRequestException);
  });
});