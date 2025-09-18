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
  Int,
  registerEnumType 
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';

// Enums
enum Role {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  REVIEWER = 'REVIEWER',
  VIEWER = 'VIEWER'
}

enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

enum TaskPriority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

enum ActivityType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  CONTENT_CREATED = 'CONTENT_CREATED',
  CONTENT_REVIEWED = 'CONTENT_REVIEWED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  MEMBER_JOINED = 'MEMBER_JOINED'
}

registerEnumType(Role, { name: 'Role' });
registerEnumType(TaskStatus, { name: 'TaskStatus' });
registerEnumType(TaskPriority, { name: 'TaskPriority' });
registerEnumType(ActivityType, { name: 'ActivityType' });

// Types
@ObjectType()
class TeamMember {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field(() => Role)
  role: Role;

  @Field()
  avatar: string;

  @Field()
  joinedAt: string;

  @Field({ nullable: true })
  lastActive?: string;

  @Field(() => Int)
  tasksAssigned: number;

  @Field(() => Int)
  tasksCompleted: number;
}

@ObjectType()
class Task {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => TaskStatus)
  status: TaskStatus;

  @Field(() => TaskPriority)
  priority: TaskPriority;

  @Field({ nullable: true })
  assigneeId?: string;

  @Field({ nullable: true })
  assignee?: TeamMember;

  @Field()
  creatorId: string;

  @Field()
  creator: TeamMember;

  @Field({ nullable: true })
  dueDate?: string;

  @Field(() => [String])
  tags: string[];

  @Field(() => [String])
  contentIds: string[];

  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;
}

@ObjectType()
class Comment {
  @Field()
  id: string;

  @Field()
  taskId: string;

  @Field()
  authorId: string;

  @Field()
  author: TeamMember;

  @Field()
  content: string;

  @Field()
  createdAt: string;

  @Field({ nullable: true })
  editedAt?: string;
}

@ObjectType()
class Activity {
  @Field()
  id: string;

  @Field(() => ActivityType)
  type: ActivityType;

  @Field()
  description: string;

  @Field()
  userId: string;

  @Field()
  user: TeamMember;

  @Field({ nullable: true })
  taskId?: string;

  @Field({ nullable: true })
  contentId?: string;

  @Field()
  createdAt: string;
}

@ObjectType()
class TeamStats {
  @Field(() => Int)
  totalMembers: number;

  @Field(() => Int)
  totalTasks: number;

  @Field(() => Int)
  completedTasks: number;

  @Field(() => Int)
  inProgressTasks: number;

  @Field(() => Int)
  overdueTasks: number;

  @Field()
  completionRate: number;

  @Field(() => [TeamMember])
  topPerformers: TeamMember[];
}

// Input types
@InputType()
class CreateTaskInput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => TaskPriority)
  priority: TaskPriority;

  @Field({ nullable: true })
  assigneeId?: string;

  @Field({ nullable: true })
  dueDate?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => [String], { nullable: true })
  contentIds?: string[];
}

@InputType()
class UpdateTaskInput {
  @Field()
  taskId: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => TaskStatus, { nullable: true })
  status?: TaskStatus;

  @Field(() => TaskPriority, { nullable: true })
  priority?: TaskPriority;

  @Field({ nullable: true })
  assigneeId?: string;

  @Field({ nullable: true })
  dueDate?: string;
}

@InputType()
class AddCommentInput {
  @Field()
  taskId: string;

  @Field()
  content: string;
}

@InputType()
class InviteMemberInput {
  @Field()
  email: string;

  @Field()
  name: string;

  @Field(() => Role)
  role: Role;
}

// Service
@Injectable()
class CollaborationService {
  private members = new Map<string, TeamMember>();
  private tasks = new Map<string, Task>();
  private comments = new Map<string, Comment>();
  private activities: Activity[] = [];

  constructor() {
    // 初始化一些默认团队成员
    const defaultMembers = [
      { id: 'user_1', email: 'admin@eufy.com', name: '张伟', role: Role.ADMIN, avatar: '👤' },
      { id: 'user_2', email: 'editor1@eufy.com', name: '李娜', role: Role.EDITOR, avatar: '👩' },
      { id: 'user_3', email: 'editor2@eufy.com', name: '王刚', role: Role.EDITOR, avatar: '👨' },
      { id: 'user_4', email: 'reviewer@eufy.com', name: '陈静', role: Role.REVIEWER, avatar: '👩‍💼' }
    ];

    defaultMembers.forEach(member => {
      this.members.set(member.id, {
        ...member,
        joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        tasksAssigned: Math.floor(Math.random() * 20),
        tasksCompleted: Math.floor(Math.random() * 15)
      });
    });
  }

  private addActivity(type: ActivityType, description: string, userId: string, taskId?: string, contentId?: string) {
    this.activities.unshift({
      id: `activity_${Date.now()}`,
      type,
      description,
      userId,
      user: this.members.get(userId)!,
      taskId,
      contentId,
      createdAt: new Date().toISOString()
    });
  }

  async createTask(input: CreateTaskInput, creatorId: string): Promise<Task> {
    const taskId = `task_${Date.now()}`;
    const task: Task = {
      id: taskId,
      title: input.title,
      description: input.description,
      status: TaskStatus.TODO,
      priority: input.priority,
      assigneeId: input.assigneeId,
      assignee: input.assigneeId ? this.members.get(input.assigneeId) : undefined,
      creatorId,
      creator: this.members.get(creatorId)!,
      dueDate: input.dueDate,
      tags: input.tags || [],
      contentIds: input.contentIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tasks.set(taskId, task);
    this.addActivity(
      ActivityType.TASK_CREATED,
      `创建了任务 "${task.title}"`,
      creatorId,
      taskId
    );

    if (input.assigneeId) {
      this.addActivity(
        ActivityType.TASK_ASSIGNED,
        `将任务 "${task.title}" 分配给了 ${task.assignee?.name}`,
        creatorId,
        taskId
      );
    }

    return task;
  }

  async updateTask(input: UpdateTaskInput): Promise<Task> {
    const task = this.tasks.get(input.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    Object.assign(task, {
      ...input,
      updatedAt: new Date().toISOString()
    });

    if (input.assigneeId) {
      task.assignee = this.members.get(input.assigneeId);
    }

    if (input.status === TaskStatus.COMPLETED) {
      this.addActivity(
        ActivityType.TASK_COMPLETED,
        `完成了任务 "${task.title}"`,
        task.assigneeId || task.creatorId,
        task.id
      );
    }

    return task;
  }

  async addComment(input: AddCommentInput, authorId: string): Promise<Comment> {
    const commentId = `comment_${Date.now()}`;
    const task = this.tasks.get(input.taskId);
    
    const comment: Comment = {
      id: commentId,
      taskId: input.taskId,
      authorId,
      author: this.members.get(authorId)!,
      content: input.content,
      createdAt: new Date().toISOString()
    };

    this.comments.set(commentId, comment);
    this.addActivity(
      ActivityType.COMMENT_ADDED,
      `在任务 "${task?.title}" 中添加了评论`,
      authorId,
      input.taskId
    );

    return comment;
  }

  async inviteMember(input: InviteMemberInput): Promise<TeamMember> {
    const memberId = `user_${Date.now()}`;
    const member: TeamMember = {
      id: memberId,
      email: input.email,
      name: input.name,
      role: input.role,
      avatar: '👤',
      joinedAt: new Date().toISOString(),
      tasksAssigned: 0,
      tasksCompleted: 0
    };

    this.members.set(memberId, member);
    this.addActivity(
      ActivityType.MEMBER_JOINED,
      `${member.name} 加入了团队`,
      memberId
    );

    return member;
  }

  async getTasks(status?: TaskStatus, assigneeId?: string): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());
    
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }
    
    if (assigneeId) {
      tasks = tasks.filter(t => t.assigneeId === assigneeId);
    }

    return tasks.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTaskComments(taskId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(c => c.taskId === taskId)
      .sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.members.values());
  }

  async getActivities(limit: number = 20): Promise<Activity[]> {
    return this.activities.slice(0, limit);
  }

  async getTeamStats(): Promise<TeamStats> {
    const tasks = Array.from(this.tasks.values());
    const members = Array.from(this.members.values());
    
    const now = new Date();
    const overdueTasks = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      t.status !== TaskStatus.COMPLETED
    );

    const topPerformers = members
      .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
      .slice(0, 3);

    return {
      totalMembers: members.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      inProgressTasks: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      overdueTasks: overdueTasks.length,
      completionRate: tasks.length > 0 
        ? (tasks.filter(t => t.status === TaskStatus.COMPLETED).length / tasks.length) * 100 
        : 0,
      topPerformers
    };
  }
}

// Resolver
@Resolver()
class CollaborationResolver {
  constructor(private collaborationService: CollaborationService) {}

  @Query(() => String)
  async collaborationHealth(): Promise<string> {
    return 'Collaboration module is healthy! 👥';
  }

  @Mutation(() => Task)
  async createTask(
    @Args('input') input: CreateTaskInput
  ): Promise<Task> {
    // 模拟当前用户
    const currentUserId = 'user_1';
    return this.collaborationService.createTask(input, currentUserId);
  }

  @Mutation(() => Task)
  async updateTask(
    @Args('input') input: UpdateTaskInput
  ): Promise<Task> {
    return this.collaborationService.updateTask(input);
  }

  @Mutation(() => Comment)
  async addComment(
    @Args('input') input: AddCommentInput
  ): Promise<Comment> {
    // 模拟当前用户
    const currentUserId = 'user_2';
    return this.collaborationService.addComment(input, currentUserId);
  }

  @Mutation(() => TeamMember)
  async inviteMember(
    @Args('input') input: InviteMemberInput
  ): Promise<TeamMember> {
    return this.collaborationService.inviteMember(input);
  }

  @Query(() => [Task])
  async tasks(
    @Args('status', { nullable: true, type: () => TaskStatus }) status?: TaskStatus,
    @Args('assigneeId', { nullable: true }) assigneeId?: string
  ): Promise<Task[]> {
    return this.collaborationService.getTasks(status, assigneeId);
  }

  @Query(() => [Comment])
  async taskComments(
    @Args('taskId') taskId: string
  ): Promise<Comment[]> {
    return this.collaborationService.getTaskComments(taskId);
  }

  @Query(() => [TeamMember])
  async teamMembers(): Promise<TeamMember[]> {
    return this.collaborationService.getTeamMembers();
  }

  @Query(() => [Activity])
  async recentActivities(
    @Args('limit', { nullable: true, type: () => Int }) limit?: number
  ): Promise<Activity[]> {
    return this.collaborationService.getActivities(limit);
  }

  @Query(() => TeamStats)
  async teamStats(): Promise<TeamStats> {
    return this.collaborationService.getTeamStats();
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
  providers: [CollaborationService, CollaborationResolver],
})
class CollaborationModule {}

// Bootstrap
async function bootstrap() {
  const app = await NestFactory.create(CollaborationModule);
  
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = 4008;
  await app.listen(port);
  
  console.log(`🚀 Collaboration API running on http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`👥 Team Collaboration ready!`);
  console.log(`\n👥 Features:`);
  console.log(`   - Task Management`);
  console.log(`   - Team Members`);
  console.log(`   - Comments & Discussion`);
  console.log(`   - Activity Timeline`);
  console.log(`   - Team Statistics`);
}

bootstrap();