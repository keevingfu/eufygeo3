import { GEOCoreEngineService } from './services/geo-core-engine.service';
import { AICitationMonitorService } from './services/ai-citation-monitor.service';
import { FAQRestructuringService } from './services/faq-restructuring.service';
import { ShortVideoContentService } from './services/short-video-content.service';
import { AmazonRufusOptimizationService } from './services/amazon-rufus-optimization.service';
import { ConfigService } from '@nestjs/config';

async function testGEOServices() {
  console.log('🚀 测试 Eufy GEO3 核心服务...\n');

  // 模拟ConfigService
  const mockConfigService = new ConfigService();

  try {
    // 1. 测试GEO核心引擎
    console.log('🔥 测试 GEO 核心引擎...');
    const geoEngine = new GEOCoreEngineService(mockConfigService);
    
    const testContent = {
      title: 'Eufy Security Camera 安装指南',
      content: 'Eufy安防摄像头安装非常简单，只需5分钟即可完成。首先下载官方App，然后扫码添加设备...',
      type: 'how-to' as const,
      targetKeywords: ['eufy camera', 'security camera setup', '安全摄像头安装']
    };

    const optimizedResult = await geoEngine.optimizeForGEO(testContent);
    console.log(`✅ GEO优化完成，AI就绪度评分: ${optimizedResult.aiReadinessScore}`);
    console.log(`💡 改进建议: ${optimizedResult.recommendedImprovements.slice(0, 2).join(', ')}\n`);

    // 2. 测试AI引用监测
    console.log('🔍 测试 AI 引用监测服务...');
    const citationMonitor = new AICitationMonitorService(mockConfigService);
    
    const citationInsights = await citationMonitor.monitorAICitations();
    console.log(`✅ 引用监测完成，总引用数: ${citationInsights.totalCitations}`);
    console.log(`📊 引用率: ${(citationInsights.citationRate * 100).toFixed(1)}%`);
    console.log(`💡 建议: ${citationInsights.recommendations.slice(0, 1).join('')}\n`);

    // 3. 测试FAQ重构
    console.log('📚 测试 FAQ 重构服务...');
    const faqService = new FAQRestructuringService(mockConfigService, geoEngine);
    
    const testFAQs = [
      {
        id: 'faq1',
        question: 'Eufy摄像头如何安装？',
        answer: '安装很简单，按照说明书步骤操作即可',
        category: 'installation',
        priority: 'high' as const,
        targetKeywords: ['安装', 'setup'],
        aiOptimizationScore: 0.6,
        lastOptimized: new Date()
      },
      {
        id: 'faq2', 
        question: 'Eufy摄像头画质如何？',
        answer: '支持1080P高清画质，夜视效果清晰',
        category: 'features',
        priority: 'medium' as const,
        targetKeywords: ['画质', 'quality'],
        aiOptimizationScore: 0.7,
        lastOptimized: new Date()
      }
    ];

    const faqResult = await faqService.restructureFAQsForGEO(testFAQs);
    console.log(`✅ FAQ重构完成，生成 ${faqResult.optimizedClusters.length} 个主题聚类`);
    console.log(`📈 整体改进评分: ${faqResult.overallImprovementScore}\n`);

    // 4. 测试短视频内容生成
    console.log('🎬 测试短视频内容生成服务...');
    const videoService = new ShortVideoContentService(mockConfigService);
    
    const videoContentPlan = await videoService.generateVideoContentPlan(
      'Eufy Security Camera 2K',
      ['security camera', 'home security', 'wireless camera'],
      ['tiktok', 'youtube-shorts']
    );
    
    console.log(`✅ 视频内容计划生成完成，共 ${videoContentPlan.contentSeries.length} 个视频内容`);
    console.log(`🎯 内容策略: ${videoContentPlan.strategy.contentType}`);
    console.log(`💡 AI优化提示: ${videoContentPlan.aiOptimizationTips.slice(0, 1).join('')}\n`);

    // 5. 测试Amazon Rufus优化
    console.log('🛒 测试 Amazon Rufus 优化服务...');
    const rufusService = new AmazonRufusOptimizationService(mockConfigService);
    
    const rufusInput = {
      productName: 'Eufy Security Camera 2K',
      productCategory: 'security-cameras',
      targetKeywords: ['security camera', 'wireless camera', 'home security'],
      productFeatures: ['2K resolution', 'AI detection', 'battery powered', 'local storage']
    };

    const rufusResult = await rufusService.optimizeForRufus(rufusInput);
    console.log(`✅ Rufus优化完成，AI就绪度评分: ${rufusResult.aiReadinessScore}`);
    console.log(`💬 对话启动器数量: ${rufusResult.rufusConversationStarters.length}`);
    console.log(`🎯 优化建议: ${rufusResult.optimizationRecommendations.slice(0, 1).join('')}\n`);

    console.log('🎉 所有GEO服务测试完成！');
    console.log('\n📊 测试总结:');
    console.log('✅ GEO核心引擎 - 正常运行');
    console.log('✅ AI引用监测 - 正常运行'); 
    console.log('✅ FAQ重构系统 - 正常运行');
    console.log('✅ 短视频内容生成 - 正常运行');
    console.log('✅ Amazon Rufus优化 - 正常运行');
    console.log('\n🚀 Eufy GEO3 - Phase 1 核心功能构建完成！');

  } catch (error: any) {
    console.error('❌ 测试过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行测试
testGEOServices();