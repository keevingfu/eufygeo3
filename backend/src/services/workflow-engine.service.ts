import { Injectable, Logger } from '@nestjs/common';

export interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  type: 'KEYWORD_RESEARCH' | 'CONTENT_CREATION' | 'REVIEW' | 'PUBLICATION' | 'MONITORING' | 'OPTIMIZATION';
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  status: 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'BLOCKED';
  assignee?: string;
  estimatedHours: number;
  actualHours?: number;
  dueDate: Date;
  dependencies: string[];
  week: number;
  day: number;
  phase: string;
  deliverables: string[];
  tools: string[];
  successCriteria: string[];
  resources: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  totalDays: number;
  phases: WorkflowPhase[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  startDay: number;
  endDay: number;
  objectives: string[];
  tasks: WorkflowTask[];
}

export interface WorkflowInstance {
  id: string;
  templateId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  progress: number;
  currentPhase: string;
  currentWeek: number;
  currentDay: number;
  tasks: WorkflowTask[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);
  private templates = new Map<string, WorkflowTemplate>();
  private instances = new Map<string, WorkflowInstance>();

  constructor() {
    this.initializeDefaultTemplate();
  }

  /**
   * 初始化Eufy GEO 30天执行模板
   */
  private initializeDefaultTemplate() {
    const defaultTemplate: WorkflowTemplate = {
      id: 'eufy-geo-30day',
      name: 'Eufy GEO 30天执行模板',
      description: '基于Eufy GEO 30天执行文档的标准化工作流程',
      totalDays: 30,
      phases: [
        {
          id: 'week1-foundation',
          name: '第一周：基础建设期',
          description: '建立关键词策略基础，完成P0-P1关键词的初步内容创作',
          startDay: 1,
          endDay: 7,
          objectives: [
            '完成P0-P1关键词的深度分析',
            '建立内容创作模板和标准',
            '启动高优先级内容的创作工作',
            '设置监控和分析基础设施'
          ],
          tasks: this.generateWeek1Tasks()
        },
        {
          id: 'week2-acceleration',
          name: '第二周：加速推进期',
          description: '大规模内容创作，P0-P2关键词内容批量产出',
          startDay: 8,
          endDay: 14,
          objectives: [
            '完成P0关键词的所有内容创作',
            '推进P1-P2关键词内容开发',
            '启动多渠道内容分发',
            '建立内容质量评估体系'
          ],
          tasks: this.generateWeek2Tasks()
        },
        {
          id: 'week3-optimization',
          name: '第三周：优化提升期',
          description: '内容优化，效果监控，策略调整',
          startDay: 15,
          endDay: 21,
          objectives: [
            '基于数据反馈优化现有内容',
            '完成P3-P4关键词内容创作',
            '实施A/B测试和效果对比',
            '优化内容分发策略'
          ],
          tasks: this.generateWeek3Tasks()
        },
        {
          id: 'week4-scaling',
          name: '第四周：规模化扩展期',
          description: '规模化内容生产，长尾关键词覆盖，总结复盘',
          startDay: 22,
          endDay: 30,
          objectives: [
            '完成P5长尾关键词覆盖',
            '建立可持续的内容生产流程',
            '总结30天执行经验',
            '制定下个周期的优化计划'
          ],
          tasks: this.generateWeek4Tasks()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(defaultTemplate.id, defaultTemplate);
    this.logger.log(`已初始化默认工作流模板: ${defaultTemplate.name}`);
  }

  /**
   * 生成第一周任务
   */
  private generateWeek1Tasks(): WorkflowTask[] {
    return [
      {
        id: 'w1-d1-keyword-audit',
        title: 'P0-P1关键词深度审计',
        description: '对所有P0和P1关键词进行深度分析，包括搜索意图、竞争分析、AIO适配性评估',
        type: 'KEYWORD_RESEARCH',
        priority: 'P0',
        status: 'PENDING',
        estimatedHours: 6,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        dependencies: [],
        week: 1,
        day: 1,
        phase: 'week1-foundation',
        deliverables: ['关键词分析报告', 'AIO适配性评分', '竞争对手分析'],
        tools: ['Keyword Grading Service', 'AIO Adaptability Service', 'Google Search Console'],
        successCriteria: ['完成所有P0-P1关键词的评分', 'AIO适配性分析完成率100%'],
        resources: ['SEO分析师', '内容策略师'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w1-d2-content-template',
        title: '内容模板建设',
        description: '基于关键词分析结果，建立标准化的内容创作模板',
        type: 'CONTENT_CREATION',
        priority: 'P1',
        status: 'PENDING',
        estimatedHours: 4,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        dependencies: ['w1-d1-keyword-audit'],
        week: 1,
        day: 2,
        phase: 'week1-foundation',
        deliverables: ['How-to内容模板', '比较类内容模板', '问答类内容模板'],
        tools: ['Content Management System', 'AI Writing Assistant'],
        successCriteria: ['模板覆盖所有关键词类型', '模板通过质量评审'],
        resources: ['内容设计师', '技术写手'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w1-d3-p0-content-start',
        title: 'P0关键词内容创作启动',
        description: '开始P0优先级关键词的内容创作工作',
        type: 'CONTENT_CREATION',
        priority: 'P0',
        status: 'PENDING',
        estimatedHours: 8,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        dependencies: ['w1-d2-content-template'],
        week: 1,
        day: 3,
        phase: 'week1-foundation',
        deliverables: ['P0关键词内容大纲', '首批内容草稿'],
        tools: ['AI Content Generator', 'Grammarly', 'Plagiarism Checker'],
        successCriteria: ['P0关键词内容覆盖率50%', '内容质量评分>85'],
        resources: ['高级内容创作者', 'AI写作助手'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w1-d5-monitoring-setup',
        title: '监控体系建设',
        description: '建立关键词排名、AIO覆盖率、流量等核心指标的监控体系',
        type: 'MONITORING',
        priority: 'P2',
        status: 'PENDING',
        estimatedHours: 5,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        dependencies: [],
        week: 1,
        day: 5,
        phase: 'week1-foundation',
        deliverables: ['监控仪表板', '警报配置', '报告模板'],
        tools: ['Google Analytics', 'Search Console', 'Custom Dashboard'],
        successCriteria: ['监控覆盖所有P0-P1关键词', '自动报告生成'],
        resources: ['数据分析师', '系统管理员'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w1-d7-week1-review',
        title: '第一周工作复盘',
        description: '总结第一周工作成果，调整后续计划',
        type: 'REVIEW',
        priority: 'P2',
        status: 'PENDING',
        estimatedHours: 2,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        dependencies: ['w1-d1-keyword-audit', 'w1-d2-content-template', 'w1-d3-p0-content-start'],
        week: 1,
        day: 7,
        phase: 'week1-foundation',
        deliverables: ['周总结报告', '问题清单', '改进计划'],
        tools: ['Project Management Tool', 'Analytics Dashboard'],
        successCriteria: ['所有任务完成率>90%', '质量达标率>85%'],
        resources: ['项目经理', '团队负责人'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * 生成第二周任务
   */
  private generateWeek2Tasks(): WorkflowTask[] {
    return [
      {
        id: 'w2-d8-p0-content-complete',
        title: 'P0关键词内容完成',
        description: '完成所有P0关键词的内容创作和优化',
        type: 'CONTENT_CREATION',
        priority: 'P0',
        status: 'PENDING',
        estimatedHours: 10,
        dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        dependencies: ['w1-d3-p0-content-start'],
        week: 2,
        day: 8,
        phase: 'week2-acceleration',
        deliverables: ['P0关键词完整内容', '内容质量检查报告'],
        tools: ['Content Editor', 'SEO Optimization Tool', 'Quality Checker'],
        successCriteria: ['P0关键词内容完成率100%', '内容质量评分>90'],
        resources: ['内容团队', '质量保证专员'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w2-d10-p1-batch-creation',
        title: 'P1关键词批量创作',
        description: '启动P1关键词的批量内容创作',
        type: 'CONTENT_CREATION',
        priority: 'P1',
        status: 'PENDING',
        estimatedHours: 12,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        dependencies: ['w2-d8-p0-content-complete'],
        week: 2,
        day: 10,
        phase: 'week2-acceleration',
        deliverables: ['P1关键词内容包', '内容分发计划'],
        tools: ['Batch Content Generator', 'Multi-channel Publisher'],
        successCriteria: ['P1关键词内容覆盖率80%', '发布准备率100%'],
        resources: ['内容创作团队', '渠道运营专员'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w2-d12-multichannel-distribution',
        title: '多渠道内容分发',
        description: '在Google、YouTube、Reddit等平台同步发布内容',
        type: 'PUBLICATION',
        priority: 'P1',
        status: 'PENDING',
        estimatedHours: 6,
        dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        dependencies: ['w2-d10-p1-batch-creation'],
        week: 2,
        day: 12,
        phase: 'week2-acceleration',
        deliverables: ['跨平台发布记录', '发布效果初步报告'],
        tools: ['Social Media Manager', 'Content Scheduler', 'Analytics Tools'],
        successCriteria: ['内容发布成功率>95%', '各平台覆盖完整'],
        resources: ['社媒运营', '渠道管理员'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w2-d14-quality-assessment',
        title: '内容质量评估体系',
        description: '建立内容质量评估标准和流程',
        type: 'REVIEW',
        priority: 'P2',
        status: 'PENDING',
        estimatedHours: 4,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        dependencies: ['w2-d12-multichannel-distribution'],
        week: 2,
        day: 14,
        phase: 'week2-acceleration',
        deliverables: ['质量评估标准', '评分系统', '改进建议'],
        tools: ['Quality Metrics Dashboard', 'Content Analyzer'],
        successCriteria: ['评估标准覆盖全面', '自动化评分可用'],
        resources: ['质量管理专员', '内容策略师'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * 生成第三周任务
   */
  private generateWeek3Tasks(): WorkflowTask[] {
    return [
      {
        id: 'w3-d15-data-driven-optimization',
        title: '数据驱动内容优化',
        description: '基于前两周数据反馈，优化现有内容',
        type: 'OPTIMIZATION',
        priority: 'P1',
        status: 'PENDING',
        estimatedHours: 8,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        dependencies: ['w2-d14-quality-assessment'],
        week: 3,
        day: 15,
        phase: 'week3-optimization',
        deliverables: ['优化内容清单', '性能提升报告'],
        tools: ['Analytics Engine', 'A/B Testing Platform', 'Content Optimizer'],
        successCriteria: ['内容性能提升>20%', '用户体验评分提高'],
        resources: ['数据分析师', '内容优化专员'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w3-d17-p3-p4-content',
        title: 'P3-P4关键词内容创作',
        description: '完成中低优先级关键词的内容开发',
        type: 'CONTENT_CREATION',
        priority: 'P3',
        status: 'PENDING',
        estimatedHours: 10,
        dueDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
        dependencies: ['w3-d15-data-driven-optimization'],
        week: 3,
        day: 17,
        phase: 'week3-optimization',
        deliverables: ['P3-P4关键词内容', '长尾词覆盖计划'],
        tools: ['Content Template Engine', 'Keyword Expansion Tool'],
        successCriteria: ['P3-P4关键词覆盖率>70%', '内容质量达标'],
        resources: ['内容创作者', 'AI写作助手'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w3-d19-ab-testing',
        title: 'A/B测试实施',
        description: '对不同内容版本进行A/B测试，优化转化效果',
        type: 'OPTIMIZATION',
        priority: 'P2',
        status: 'PENDING',
        estimatedHours: 6,
        dueDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
        dependencies: ['w3-d17-p3-p4-content'],
        week: 3,
        day: 19,
        phase: 'week3-optimization',
        deliverables: ['A/B测试报告', '最优版本推荐'],
        tools: ['A/B Testing Suite', 'Statistical Analysis Tool'],
        successCriteria: ['测试样本量充足', '统计显著性>95%'],
        resources: ['增长黑客', '数据科学家'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w3-d21-distribution-optimization',
        title: '内容分发策略优化',
        description: '基于各渠道表现数据，优化内容分发策略',
        type: 'OPTIMIZATION',
        priority: 'P2',
        status: 'PENDING',
        estimatedHours: 4,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        dependencies: ['w3-d19-ab-testing'],
        week: 3,
        day: 21,
        phase: 'week3-optimization',
        deliverables: ['渠道优化方案', '资源配置调整'],
        tools: ['Multi-channel Analytics', 'Resource Allocation Tool'],
        successCriteria: ['各渠道ROI提升', '资源利用率优化'],
        resources: ['渠道经理', '运营策略师'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * 生成第四周任务
   */
  private generateWeek4Tasks(): WorkflowTask[] {
    return [
      {
        id: 'w4-d22-p5-longtail-coverage',
        title: 'P5长尾关键词覆盖',
        description: '完成所有P5长尾关键词的内容覆盖',
        type: 'CONTENT_CREATION',
        priority: 'P5',
        status: 'PENDING',
        estimatedHours: 12,
        dueDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
        dependencies: ['w3-d21-distribution-optimization'],
        week: 4,
        day: 22,
        phase: 'week4-scaling',
        deliverables: ['P5关键词内容包', '长尾词策略总结'],
        tools: ['Automated Content Generator', 'Long-tail Keyword Tool'],
        successCriteria: ['P5关键词覆盖率>90%', '自动化率>80%'],
        resources: ['内容自动化专员', 'AI系统'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w4-d25-sustainable-process',
        title: '可持续内容生产流程',
        description: '建立可持续的内容生产和优化流程',
        type: 'OPTIMIZATION',
        priority: 'P1',
        status: 'PENDING',
        estimatedHours: 6,
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        dependencies: ['w4-d22-p5-longtail-coverage'],
        week: 4,
        day: 25,
        phase: 'week4-scaling',
        deliverables: ['标准化流程文档', '自动化工具配置'],
        tools: ['Process Management System', 'Automation Platform'],
        successCriteria: ['流程文档化完成', '自动化覆盖>70%'],
        resources: ['流程专家', '自动化工程师'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w4-d28-30day-summary',
        title: '30天执行总结',
        description: '全面总结30天执行成果，分析成功经验和改进点',
        type: 'REVIEW',
        priority: 'P1',
        status: 'PENDING',
        estimatedHours: 8,
        dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        dependencies: ['w4-d25-sustainable-process'],
        week: 4,
        day: 28,
        phase: 'week4-scaling',
        deliverables: ['执行总结报告', '成功案例分析', 'ROI计算报告'],
        tools: ['Analytics Suite', 'Report Generator', 'ROI Calculator'],
        successCriteria: ['数据完整准确', '洞察具有价值'],
        resources: ['项目经理', '业务分析师'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'w4-d30-next-cycle-planning',
        title: '下周期优化计划',
        description: '制定下个30天周期的优化和扩展计划',
        type: 'REVIEW',
        priority: 'P2',
        status: 'PENDING',
        estimatedHours: 4,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        dependencies: ['w4-d28-30day-summary'],
        week: 4,
        day: 30,
        phase: 'week4-scaling',
        deliverables: ['下周期计划', '资源需求评估', '目标设定'],
        tools: ['Planning Tool', 'Resource Management System'],
        successCriteria: ['计划具体可执行', '目标量化明确'],
        resources: ['战略规划师', '项目负责人'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * 创建工作流实例
   */
  async createWorkflowInstance(
    templateId: string,
    name: string,
    description: string,
    startDate: Date,
    metadata: Record<string, any> = {}
  ): Promise<WorkflowInstance> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`工作流模板不存在: ${templateId}`);
    }

    const instance: WorkflowInstance = {
      id: `instance-${Date.now()}`,
      templateId,
      name,
      description,
      startDate,
      endDate: new Date(startDate.getTime() + template.totalDays * 24 * 60 * 60 * 1000),
      status: 'PLANNING',
      progress: 0,
      currentPhase: template.phases[0]?.id || '',
      currentWeek: 1,
      currentDay: 1,
      tasks: this.generateTasksFromTemplate(template, startDate),
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.instances.set(instance.id, instance);
    this.logger.log(`创建工作流实例: ${instance.name} (${instance.id})`);
    
    return instance;
  }

  /**
   * 从模板生成任务
   */
  private generateTasksFromTemplate(template: WorkflowTemplate, startDate: Date): WorkflowTask[] {
    const tasks: WorkflowTask[] = [];
    
    for (const phase of template.phases) {
      for (const task of phase.tasks) {
        const newTask: WorkflowTask = {
          ...task,
          id: `${task.id}-${Date.now()}`,
          dueDate: new Date(startDate.getTime() + (task.day - 1) * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        tasks.push(newTask);
      }
    }
    
    return tasks;
  }

  /**
   * 启动工作流实例
   */
  async startWorkflowInstance(instanceId: string): Promise<WorkflowInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`工作流实例不存在: ${instanceId}`);
    }

    instance.status = 'ACTIVE';
    instance.updatedAt = new Date();
    
    this.logger.log(`启动工作流实例: ${instance.name}`);
    return instance;
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(
    instanceId: string,
    taskId: string,
    status: WorkflowTask['status'],
    actualHours?: number
  ): Promise<WorkflowTask> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`工作流实例不存在: ${instanceId}`);
    }

    const task = instance.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }

    task.status = status;
    task.updatedAt = new Date();
    if (actualHours !== undefined) {
      task.actualHours = actualHours;
    }

    // 更新实例进度
    this.updateInstanceProgress(instance);
    
    this.logger.log(`任务状态更新: ${task.title} -> ${status}`);
    return task;
  }

  /**
   * 更新实例进度
   */
  private updateInstanceProgress(instance: WorkflowInstance) {
    const completedTasks = instance.tasks.filter(t => t.status === 'COMPLETED').length;
    const totalTasks = instance.tasks.length;
    
    instance.progress = Math.round((completedTasks / totalTasks) * 100);
    instance.updatedAt = new Date();
    
    // 检查是否完成
    if (instance.progress === 100) {
      instance.status = 'COMPLETED';
    }
  }

  /**
   * 获取工作流模板
   */
  async getWorkflowTemplate(templateId: string): Promise<WorkflowTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  /**
   * 获取所有工作流模板
   */
  async getAllWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return Array.from(this.templates.values());
  }

  /**
   * 获取工作流实例
   */
  async getWorkflowInstance(instanceId: string): Promise<WorkflowInstance | null> {
    return this.instances.get(instanceId) || null;
  }

  /**
   * 获取所有工作流实例
   */
  async getAllWorkflowInstances(): Promise<WorkflowInstance[]> {
    return Array.from(this.instances.values());
  }

  /**
   * 获取当前活跃任务
   */
  async getActiveTasks(instanceId: string): Promise<WorkflowTask[]> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return [];
    }

    const today = new Date();
    const startDate = instance.startDate;
    const currentDay = Math.ceil((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    return instance.tasks.filter(task => 
      task.day <= currentDay && 
      (task.status === 'PENDING' || task.status === 'IN_PROGRESS')
    );
  }

  /**
   * 获取工作流统计信息
   */
  async getWorkflowStats(instanceId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    blockedTasks: number;
    progress: number;
    estimatedHours: number;
    actualHours: number;
    efficiency: number;
  }> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`工作流实例不存在: ${instanceId}`);
    }

    const stats = {
      totalTasks: instance.tasks.length,
      completedTasks: instance.tasks.filter(t => t.status === 'COMPLETED').length,
      inProgressTasks: instance.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      pendingTasks: instance.tasks.filter(t => t.status === 'PENDING').length,
      blockedTasks: instance.tasks.filter(t => t.status === 'BLOCKED').length,
      progress: instance.progress,
      estimatedHours: instance.tasks.reduce((sum, task) => sum + task.estimatedHours, 0),
      actualHours: instance.tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
      efficiency: 0
    };

    // 计算效率 (预估时间 vs 实际时间)
    if (stats.actualHours > 0) {
      stats.efficiency = Math.round((stats.estimatedHours / stats.actualHours) * 100);
    }

    return stats;
  }
}