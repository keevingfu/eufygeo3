import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GEOResolver } from './geo.resolver';
import { GEOCoreEngineService } from '../../services/geo-core-engine.service';
import { AICitationMonitorService } from '../../services/ai-citation-monitor.service';
import { FAQRestructuringService } from '../../services/faq-restructuring.service';
import { ShortVideoContentService } from '../../services/short-video-content.service';
import { AmazonRufusOptimizationService } from '../../services/amazon-rufus-optimization.service';

@Module({
  imports: [ConfigModule],
  providers: [
    GEOResolver,
    GEOCoreEngineService,
    AICitationMonitorService,
    FAQRestructuringService,
    ShortVideoContentService,
    AmazonRufusOptimizationService
  ],
  exports: [
    GEOCoreEngineService,
    AICitationMonitorService,
    FAQRestructuringService,
    ShortVideoContentService,
    AmazonRufusOptimizationService
  ]
})
export class GEOModule {}