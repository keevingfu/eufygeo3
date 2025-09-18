export interface KeywordPriority {
  level: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  minVolume: number;
  maxVolume?: number;
  description: string;
  resourceAllocation: string;
}

export class KeywordGradingService {
  private static priorityLevels: KeywordPriority[] = [
    {
      level: 'P0',
      minVolume: 100000,
      description: '超高流量，战略核心',
      resourceAllocation: '最高优先级，全力投入'
    },
    {
      level: 'P1',
      minVolume: 50000,
      maxVolume: 99999,
      description: '高流量，重点投入',
      resourceAllocation: '高优先级，重点投入'
    },
    {
      level: 'P2',
      minVolume: 20000,
      maxVolume: 49999,
      description: '中高流量，稳定发展',
      resourceAllocation: '中高优先级，稳定投入'
    },
    {
      level: 'P3',
      minVolume: 10000,
      maxVolume: 19999,
      description: '中等流量，选择投入',
      resourceAllocation: '中等优先级，选择投入'
    },
    {
      level: 'P4',
      minVolume: 5000,
      maxVolume: 9999,
      description: '低流量，长尾机会',
      resourceAllocation: '低优先级，机会投入'
    },
    {
      level: 'P5',
      minVolume: 0,
      maxVolume: 4999,
      description: '微流量，精准定位',
      resourceAllocation: '最低优先级，长尾策略'
    }
  ];

  /**
   * 根据搜索量计算关键词优先级
   */
  static calculatePriority(monthlySearchVolume: number): string {
    if (monthlySearchVolume >= 100000) return 'P0';
    if (monthlySearchVolume >= 50000) return 'P1';
    if (monthlySearchVolume >= 20000) return 'P2';
    if (monthlySearchVolume >= 10000) return 'P3';
    if (monthlySearchVolume >= 5000) return 'P4';
    return 'P5';
  }

  /**
   * 获取优先级详细信息
   */
  static getPriorityInfo(priority: string): KeywordPriority | undefined {
    return this.priorityLevels.find(level => level.level === priority);
  }

  /**
   * 批量计算关键词优先级
   */
  static batchCalculatePriorities(keywords: Array<{ id: string; searchVolume: number }>) {
    return keywords.map(keyword => ({
      id: keyword.id,
      priority: this.calculatePriority(keyword.searchVolume),
      priorityInfo: this.getPriorityInfo(this.calculatePriority(keyword.searchVolume))
    }));
  }

  /**
   * 获取优先级分布统计
   */
  static getPriorityDistribution(keywords: Array<{ searchVolume: number }>) {
    const distribution = {
      P0: 0,
      P1: 0,
      P2: 0,
      P3: 0,
      P4: 0,
      P5: 0,
      total: keywords.length
    };

    keywords.forEach(keyword => {
      const priority = this.calculatePriority(keyword.searchVolume);
      distribution[priority as keyof typeof distribution]++;
    });

    return {
      ...distribution,
      percentages: {
        P0: ((distribution.P0 / distribution.total) * 100).toFixed(2) + '%',
        P1: ((distribution.P1 / distribution.total) * 100).toFixed(2) + '%',
        P2: ((distribution.P2 / distribution.total) * 100).toFixed(2) + '%',
        P3: ((distribution.P3 / distribution.total) * 100).toFixed(2) + '%',
        P4: ((distribution.P4 / distribution.total) * 100).toFixed(2) + '%',
        P5: ((distribution.P5 / distribution.total) * 100).toFixed(2) + '%'
      }
    };
  }

  /**
   * 获取优先级配置
   */
  static getPriorityConfiguration() {
    return this.priorityLevels;
  }

  /**
   * 自定义优先级规则（可以根据业务需求调整）
   */
  static updatePriorityRules(newRules: KeywordPriority[]) {
    // 验证规则的完整性和合理性
    if (newRules.length !== 6) {
      throw new Error('必须提供6个优先级规则（P0-P5）');
    }
    
    // 验证规则的连续性
    for (let i = 1; i < newRules.length; i++) {
      const current = newRules[i];
      const previous = newRules[i - 1];
      if (current && previous && current.minVolume >= previous.minVolume) {
        throw new Error('优先级规则必须按搜索量降序排列');
      }
    }

    this.priorityLevels = newRules;
  }
}