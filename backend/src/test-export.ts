import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { 
  Resolver, 
  Query, 
  Mutation,
  Args, 
  ObjectType, 
  Field, 
  InputType,
  registerEnumType 
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';

// Enums
enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  DOCX = 'DOCX',
  HTML = 'HTML',
  JSON = 'JSON'
}

enum ReportType {
  KEYWORD_ANALYSIS = 'KEYWORD_ANALYSIS',
  CONTENT_PERFORMANCE = 'CONTENT_PERFORMANCE',
  COMPETITOR_ANALYSIS = 'COMPETITOR_ANALYSIS',
  SEO_AUDIT = 'SEO_AUDIT',
  MONTHLY_SUMMARY = 'MONTHLY_SUMMARY',
  CUSTOM = 'CUSTOM'
}

enum ExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

registerEnumType(ExportFormat, { name: 'ExportFormat' });
registerEnumType(ReportType, { name: 'ReportType' });
registerEnumType(ExportStatus, { name: 'ExportStatus' });

// Types
@ObjectType()
class ExportJob {
  @Field()
  id: string;

  @Field(() => ReportType)
  reportType: ReportType;

  @Field(() => ExportFormat)
  format: ExportFormat;

  @Field(() => ExportStatus)
  status: ExportStatus;

  @Field()
  fileName: string;

  @Field({ nullable: true })
  downloadUrl?: string;

  @Field()
  fileSize: number;

  @Field()
  progress: number;

  @Field({ nullable: true })
  error?: string;

  @Field()
  createdAt: string;

  @Field({ nullable: true })
  completedAt?: string;
}

@ObjectType()
class ReportTemplate {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => ReportType)
  type: ReportType;

  @Field(() => [ExportFormat])
  supportedFormats: ExportFormat[];

  @Field(() => [String])
  sections: string[];

  @Field()
  isCustomizable: boolean;
}

@ObjectType()
class ExportStats {
  @Field()
  totalExports: number;

  @Field()
  completedExports: number;

  @Field()
  failedExports: number;

  @Field()
  averageProcessingTime: number; // seconds

  @Field(() => ExportFormat)
  mostUsedFormat: ExportFormat;

  @Field(() => ReportType)
  mostRequestedReport: ReportType;
}

// Input types
@InputType()
class CreateExportInput {
  @Field(() => ReportType)
  reportType: ReportType;

  @Field(() => ExportFormat)
  format: ExportFormat;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  dateFrom?: string;

  @Field({ nullable: true })
  dateTo?: string;

  @Field(() => [String], { nullable: true })
  includeKeywords?: string[];

  @Field(() => [String], { nullable: true })
  includeContent?: string[];

  @Field({ nullable: true })
  customTemplate?: string;

  @Field({ nullable: true })
  emailOnComplete?: boolean;
}

@InputType()
class ScheduleExportInput {
  @Field(() => ReportType)
  reportType: ReportType;

  @Field(() => ExportFormat)
  format: ExportFormat;

  @Field()
  frequency: string; // 'daily', 'weekly', 'monthly'

  @Field()
  time: string; // HH:MM

  @Field({ nullable: true })
  dayOfWeek?: number; // 0-6 for weekly

  @Field({ nullable: true })
  dayOfMonth?: number; // 1-31 for monthly

  @Field()
  recipients: string; // Email addresses
}

// Service
@Injectable()
class ExportService {
  private exportJobs = new Map<string, ExportJob>();
  private templates = new Map<string, ReportTemplate>();
  private schedules: any[] = [];

  constructor() {
    // 初始化报告模板
    const defaultTemplates: ReportTemplate[] = [
      {
        id: 'template_1',
        name: '关键词分析报告',
        description: '详细的关键词表现分析，包括搜索量、竞争度和趋势',
        type: ReportType.KEYWORD_ANALYSIS,
        supportedFormats: [ExportFormat.PDF, ExportFormat.EXCEL, ExportFormat.CSV],
        sections: ['概览', '关键词列表', '趋势分析', '机会识别', '建议'],
        isCustomizable: true
      },
      {
        id: 'template_2',
        name: '内容表现报告',
        description: 'AI生成内容的表现分析，包括SEO评分和参与度',
        type: ReportType.CONTENT_PERFORMANCE,
        supportedFormats: [ExportFormat.PDF, ExportFormat.DOCX, ExportFormat.HTML],
        sections: ['内容概览', 'SEO表现', '参与度指标', '优化建议'],
        isCustomizable: true
      },
      {
        id: 'template_3',
        name: '竞争对手分析',
        description: '市场竞争格局和对手表现对比',
        type: ReportType.COMPETITOR_ANALYSIS,
        supportedFormats: [ExportFormat.PDF, ExportFormat.EXCEL],
        sections: ['市场份额', '关键词对比', '内容策略', 'SWOT分析'],
        isCustomizable: false
      },
      {
        id: 'template_4',
        name: '月度总结报告',
        description: '每月SEO表现的完整总结',
        type: ReportType.MONTHLY_SUMMARY,
        supportedFormats: [ExportFormat.PDF, ExportFormat.DOCX],
        sections: ['执行摘要', '关键指标', '内容产出', '下月计划'],
        isCustomizable: true
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private generateMockFileUrl(format: ExportFormat): string {
    const baseUrl = 'http://localhost:4008/exports/';
    const extensions: { [key in ExportFormat]: string } = {
      [ExportFormat.PDF]: '.pdf',
      [ExportFormat.EXCEL]: '.xlsx',
      [ExportFormat.CSV]: '.csv',
      [ExportFormat.DOCX]: '.docx',
      [ExportFormat.HTML]: '.html',
      [ExportFormat.JSON]: '.json'
    };
    return `${baseUrl}report_${Date.now()}${extensions[format]}`;
  }

  private calculateFileSize(reportType: ReportType, format: ExportFormat): number {
    // 模拟不同报告类型和格式的文件大小（字节）
    const baseSizes: { [key in ReportType]: number } = {
      [ReportType.KEYWORD_ANALYSIS]: 500000,
      [ReportType.CONTENT_PERFORMANCE]: 750000,
      [ReportType.COMPETITOR_ANALYSIS]: 600000,
      [ReportType.SEO_AUDIT]: 1000000,
      [ReportType.MONTHLY_SUMMARY]: 1200000,
      [ReportType.CUSTOM]: 800000
    };

    const formatMultipliers: { [key in ExportFormat]: number } = {
      [ExportFormat.PDF]: 1.5,
      [ExportFormat.EXCEL]: 0.8,
      [ExportFormat.CSV]: 0.3,
      [ExportFormat.DOCX]: 1.2,
      [ExportFormat.HTML]: 0.6,
      [ExportFormat.JSON]: 0.4
    };

    return Math.floor(baseSizes[reportType] * formatMultipliers[format]);
  }

  async createExport(input: CreateExportInput): Promise<ExportJob> {
    const jobId = `export_${Date.now()}`;
    const fileName = `${input.title || input.reportType.toLowerCase()}_${new Date().toISOString().split('T')[0]}`;
    
    const job: ExportJob = {
      id: jobId,
      reportType: input.reportType,
      format: input.format,
      status: ExportStatus.PENDING,
      fileName,
      fileSize: 0,
      progress: 0,
      createdAt: new Date().toISOString()
    };

    this.exportJobs.set(jobId, job);

    // 模拟异步导出过程
    this.processExport(job);

    return job;
  }

  private async processExport(job: ExportJob) {
    // 模拟处理过程
    setTimeout(() => {
      job.status = ExportStatus.PROCESSING;
      job.progress = 25;
    }, 1000);

    setTimeout(() => {
      job.progress = 50;
    }, 2000);

    setTimeout(() => {
      job.progress = 75;
    }, 3000);

    setTimeout(() => {
      job.status = ExportStatus.COMPLETED;
      job.progress = 100;
      job.downloadUrl = this.generateMockFileUrl(job.format);
      job.fileSize = this.calculateFileSize(job.reportType, job.format);
      job.completedAt = new Date().toISOString();
    }, 4000);
  }

  async getExportJob(jobId: string): Promise<ExportJob> {
    const job = this.exportJobs.get(jobId);
    if (!job) {
      throw new Error('Export job not found');
    }
    return job;
  }

  async getExportHistory(limit: number = 10): Promise<ExportJob[]> {
    return Array.from(this.exportJobs.values())
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  }

  async scheduleExport(input: ScheduleExportInput): Promise<string> {
    const scheduleId = `schedule_${Date.now()}`;
    
    this.schedules.push({
      id: scheduleId,
      ...input,
      createdAt: new Date().toISOString(),
      active: true
    });

    return `Export scheduled successfully with ID: ${scheduleId}`;
  }

  async getTemplates(): Promise<ReportTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getExportStats(): Promise<ExportStats> {
    const jobs = Array.from(this.exportJobs.values());
    const completed = jobs.filter(j => j.status === ExportStatus.COMPLETED);
    const failed = jobs.filter(j => j.status === ExportStatus.FAILED);

    // 计算平均处理时间
    const processingTimes = completed
      .filter(j => j.completedAt)
      .map(j => {
        const start = new Date(j.createdAt).getTime();
        const end = new Date(j.completedAt!).getTime();
        return (end - start) / 1000; // seconds
      });

    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    // 统计最常用的格式和报告类型
    const formatCounts = new Map<ExportFormat, number>();
    const typeCounts = new Map<ReportType, number>();

    jobs.forEach(job => {
      formatCounts.set(job.format, (formatCounts.get(job.format) || 0) + 1);
      typeCounts.set(job.reportType, (typeCounts.get(job.reportType) || 0) + 1);
    });

    const mostUsedFormat = Array.from(formatCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || ExportFormat.PDF;

    const mostRequestedReport = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || ReportType.KEYWORD_ANALYSIS;

    return {
      totalExports: jobs.length,
      completedExports: completed.length,
      failedExports: failed.length,
      averageProcessingTime: Math.round(avgProcessingTime),
      mostUsedFormat,
      mostRequestedReport
    };
  }
}

// Resolver
@Resolver()
class ExportResolver {
  constructor(private exportService: ExportService) {}

  @Query(() => String)
  async exportHealth(): Promise<string> {
    return 'Export module is healthy! 📤';
  }

  @Mutation(() => ExportJob)
  async createExport(
    @Args('input') input: CreateExportInput
  ): Promise<ExportJob> {
    return this.exportService.createExport(input);
  }

  @Mutation(() => String)
  async scheduleExport(
    @Args('input') input: ScheduleExportInput
  ): Promise<string> {
    return this.exportService.scheduleExport(input);
  }

  @Query(() => ExportJob)
  async exportJob(
    @Args('jobId') jobId: string
  ): Promise<ExportJob> {
    return this.exportService.getExportJob(jobId);
  }

  @Query(() => [ExportJob])
  async exportHistory(
    @Args('limit', { nullable: true }) limit?: number
  ): Promise<ExportJob[]> {
    return this.exportService.getExportHistory(limit);
  }

  @Query(() => [ReportTemplate])
  async reportTemplates(): Promise<ReportTemplate[]> {
    return this.exportService.getTemplates();
  }

  @Query(() => ExportStats)
  async exportStats(): Promise<ExportStats> {
    return this.exportService.getExportStats();
  }
}

// Module
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      introspection: true,
    }),
  ],
  providers: [ExportService, ExportResolver],
})
class ExportModule {}

// Bootstrap
async function bootstrap() {
  const app = await NestFactory.create(ExportModule);
  
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = 4009;
  await app.listen(port);
  
  console.log(`🚀 Export API running on http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`📤 Export & Reporting ready!`);
  console.log(`\n📑 Supported Formats:`);
  console.log(`   - PDF`);
  console.log(`   - Excel (XLSX)`);
  console.log(`   - CSV`);
  console.log(`   - Word (DOCX)`);
  console.log(`   - HTML`);
  console.log(`   - JSON`);
}

bootstrap();