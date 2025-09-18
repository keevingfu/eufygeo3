import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ObjectType, Field, InputType } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { WorkflowEngineService, WorkflowTask, WorkflowTemplate, WorkflowInstance } from './services/workflow-engine.service';

// GraphQL Types
@ObjectType()
class WorkflowTaskType {
  @Field()
  id: string = '';

  @Field()
  title: string = '';

  @Field()
  description: string = '';

  @Field()
  type: string = '';

  @Field()
  priority: string = '';

  @Field()
  status: string = '';

  @Field({ nullable: true })
  assignee: string = '';

  @Field()
  estimatedHours: number = 0;

  @Field({ nullable: true })
  actualHours: number = 0;

  @Field()
  dueDate: Date = new Date();

  @Field(() => [String])
  dependencies: string[] = [];

  @Field()
  week: number = 0;

  @Field()
  day: number = 0;

  @Field()
  phase: string = '';

  @Field(() => [String])
  deliverables: string[] = [];

  @Field(() => [String])
  tools: string[] = [];

  @Field(() => [String])
  successCriteria: string[] = [];

  @Field(() => [String])
  resources: string[] = [];

  @Field()
  createdAt: Date = new Date();

  @Field()
  updatedAt: Date = new Date();
}

@ObjectType()
class WorkflowPhaseType {
  @Field()
  id: string = '';

  @Field()
  name: string = '';

  @Field()
  description: string = '';

  @Field()
  startDay: number = 0;

  @Field()
  endDay: number = 0;

  @Field(() => [String])
  objectives: string[] = [];

  @Field(() => [WorkflowTaskType])
  tasks: WorkflowTaskType[] = [];
}

@ObjectType()
class WorkflowTemplateType {
  @Field()
  id: string = '';

  @Field()
  name: string = '';

  @Field()
  description: string = '';

  @Field()
  totalDays: number = 0;

  @Field(() => [WorkflowPhaseType])
  phases: WorkflowPhaseType[] = [];

  @Field()
  createdAt: Date = new Date();

  @Field()
  updatedAt: Date = new Date();
}

@ObjectType()
class WorkflowInstanceType {
  @Field()
  id: string = '';

  @Field()
  templateId: string = '';

  @Field()
  name: string = '';

  @Field()
  description: string = '';

  @Field()
  startDate: Date = new Date();

  @Field()
  endDate: Date = new Date();

  @Field()
  status: string = '';

  @Field()
  progress: number = 0;

  @Field()
  currentPhase: string = '';

  @Field()
  currentWeek: number = 0;

  @Field()
  currentDay: number = 0;

  @Field(() => [WorkflowTaskType])
  tasks: WorkflowTaskType[] = [];

  @Field()
  createdAt: Date = new Date();

  @Field()
  updatedAt: Date = new Date();
}

@ObjectType()
class WorkflowStatsType {
  @Field()
  totalTasks: number = 0;

  @Field()
  completedTasks: number = 0;

  @Field()
  inProgressTasks: number = 0;

  @Field()
  pendingTasks: number = 0;

  @Field()
  blockedTasks: number = 0;

  @Field()
  progress: number = 0;

  @Field()
  estimatedHours: number = 0;

  @Field()
  actualHours: number = 0;

  @Field()
  efficiency: number = 0;
}

// Input Types
@InputType()
class CreateWorkflowInstanceInput {
  @Field()
  @IsString()
  templateId: string = '';

  @Field()
  @IsString()
  name: string = '';

  @Field()
  @IsString()
  description: string = '';

  @Field()
  @IsDateString()
  startDate: string = '';
}

@InputType()
class UpdateTaskStatusInput {
  @Field()
  @IsString()
  instanceId: string = '';

  @Field()
  @IsString()
  taskId: string = '';

  @Field()
  @IsEnum(['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED'])
  status: string = '';

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  actualHours?: number;
}

// Service
@Injectable()
class WorkflowService {
  constructor(private workflowEngine: WorkflowEngineService) {}

  async getAllTemplates(): Promise<WorkflowTemplate[]> {
    return this.workflowEngine.getAllWorkflowTemplates();
  }

  async getTemplate(id: string): Promise<WorkflowTemplate | null> {
    return this.workflowEngine.getWorkflowTemplate(id);
  }

  async createInstance(input: CreateWorkflowInstanceInput): Promise<WorkflowInstance> {
    return this.workflowEngine.createWorkflowInstance(
      input.templateId,
      input.name,
      input.description,
      new Date(input.startDate)
    );
  }

  async startInstance(instanceId: string): Promise<WorkflowInstance> {
    return this.workflowEngine.startWorkflowInstance(instanceId);
  }

  async getAllInstances(): Promise<WorkflowInstance[]> {
    return this.workflowEngine.getAllWorkflowInstances();
  }

  async getInstance(id: string): Promise<WorkflowInstance | null> {
    return this.workflowEngine.getWorkflowInstance(id);
  }

  async updateTaskStatus(input: UpdateTaskStatusInput): Promise<WorkflowTask> {
    return this.workflowEngine.updateTaskStatus(
      input.instanceId,
      input.taskId,
      input.status as any,
      input.actualHours
    );
  }

  async getActiveTasks(instanceId: string): Promise<WorkflowTask[]> {
    return this.workflowEngine.getActiveTasks(instanceId);
  }

  async getWorkflowStats(instanceId: string) {
    return this.workflowEngine.getWorkflowStats(instanceId);
  }
}

// Resolver
@Resolver()
class WorkflowResolver {
  constructor(private workflowService: WorkflowService) {}

  @Query(() => String)
  async workflowHealth(): Promise<string> {
    return '30天工作流引擎运行正常！🚀';
  }

  @Query(() => [WorkflowTemplateType])
  async workflowTemplates(): Promise<WorkflowTemplate[]> {
    return this.workflowService.getAllTemplates();
  }

  @Query(() => WorkflowTemplateType, { nullable: true })
  async workflowTemplate(@Args('id') id: string): Promise<WorkflowTemplate | null> {
    return this.workflowService.getTemplate(id);
  }

  @Query(() => [WorkflowInstanceType])
  async workflowInstances(): Promise<WorkflowInstance[]> {
    return this.workflowService.getAllInstances();
  }

  @Query(() => WorkflowInstanceType, { nullable: true })
  async workflowInstance(@Args('id') id: string): Promise<WorkflowInstance | null> {
    return this.workflowService.getInstance(id);
  }

  @Query(() => [WorkflowTaskType])
  async activeTasks(@Args('instanceId') instanceId: string): Promise<WorkflowTask[]> {
    return this.workflowService.getActiveTasks(instanceId);
  }

  @Query(() => WorkflowStatsType)
  async workflowStats(@Args('instanceId') instanceId: string): Promise<WorkflowStatsType> {
    const stats = await this.workflowService.getWorkflowStats(instanceId);
    return stats as WorkflowStatsType;
  }

  @Mutation(() => WorkflowInstanceType)
  async createWorkflowInstance(@Args('input') input: CreateWorkflowInstanceInput): Promise<WorkflowInstance> {
    return this.workflowService.createInstance(input);
  }

  @Mutation(() => WorkflowInstanceType)
  async startWorkflowInstance(@Args('instanceId') instanceId: string): Promise<WorkflowInstance> {
    return this.workflowService.startInstance(instanceId);
  }

  @Mutation(() => WorkflowTaskType)
  async updateTaskStatus(@Args('input') input: UpdateTaskStatusInput): Promise<WorkflowTask> {
    return this.workflowService.updateTaskStatus(input);
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
  providers: [WorkflowEngineService, WorkflowService, WorkflowResolver],
})
class WorkflowModule {}

// Bootstrap
async function bootstrap() {
  const app = await NestFactory.create(WorkflowModule);
  
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = 4005;
  await app.listen(port);
  
  console.log(`🚀 30天工作流引擎API运行在 http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`🎯 功能: 工作流模板管理 | 实例创建 | 任务追踪 | 进度监控`);
  console.log(`📈 已加载Eufy GEO 30天执行模板，包含4个阶段20+任务!`);
}

bootstrap();