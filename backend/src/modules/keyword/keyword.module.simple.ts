import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// 简化的解析器用于测试
import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class KeywordResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => String)
  async hello(): Promise<string> {
    return 'Hello from Keyword API!';
  }

  @Query(() => String)
  async dbStatus(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'Database connection successful!';
    } catch (error) {
      return `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

@Module({
  providers: [
    PrismaService,
    KeywordResolver,
  ],
  exports: [PrismaService],
})
export class KeywordModule {}