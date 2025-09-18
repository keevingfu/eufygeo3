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

// 支持的语言枚举
enum Language {
  EN = 'EN',
  ZH_CN = 'ZH_CN',
  ZH_TW = 'ZH_TW',
  ES = 'ES',
  FR = 'FR',
  DE = 'DE',
  JA = 'JA',
  KO = 'KO'
}

enum TranslationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED'
}

registerEnumType(Language, { name: 'Language' });
registerEnumType(TranslationStatus, { name: 'TranslationStatus' });

// Types
@ObjectType()
class Translation {
  @Field()
  id: string;

  @Field()
  sourceContentId: string;

  @Field(() => Language)
  sourceLang: Language;

  @Field(() => Language)
  targetLang: Language;

  @Field()
  sourceText: string;

  @Field()
  translatedText: string;

  @Field(() => TranslationStatus)
  status: TranslationStatus;

  @Field()
  quality: number; // 0-100 翻译质量评分

  @Field({ nullable: true })
  reviewNotes?: string;

  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;
}

@ObjectType()
class LanguageStats {
  @Field(() => Language)
  language: Language;

  @Field()
  totalContent: number;

  @Field()
  pendingTranslations: number;

  @Field()
  completedTranslations: number;

  @Field()
  avgQuality: number;
}

@ObjectType()
class TranslationBatch {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field(() => [String])
  contentIds: string[];

  @Field(() => Language)
  sourceLang: Language;

  @Field(() => [Language])
  targetLangs: Language[];

  @Field()
  progress: number;

  @Field()
  totalItems: number;

  @Field()
  completedItems: number;
}

// Input types
@InputType()
class TranslateContentInput {
  @Field()
  contentId: string;

  @Field(() => Language)
  targetLang: Language;

  @Field({ nullable: true })
  preserveFormatting?: boolean = true;

  @Field({ nullable: true })
  glossaryId?: string;
}

@InputType()
class BatchTranslateInput {
  @Field(() => [String])
  contentIds: string[];

  @Field(() => Language)
  sourceLang: Language;

  @Field(() => [Language])
  targetLangs: Language[];

  @Field()
  batchName: string;
}

@InputType()
class ReviewTranslationInput {
  @Field()
  translationId: string;

  @Field()
  approved: boolean;

  @Field({ nullable: true })
  reviewNotes?: string;

  @Field({ nullable: true })
  editedText?: string;
}

// Service
@Injectable()
class MultilingualService {
  private translations = new Map<string, Translation>();
  private batches = new Map<string, TranslationBatch>();
  
  // 语言名称映射
  private languageNames: { [key in Language]: string } = {
    [Language.EN]: 'English',
    [Language.ZH_CN]: '简体中文',
    [Language.ZH_TW]: '繁體中文',
    [Language.ES]: 'Español',
    [Language.FR]: 'Français',
    [Language.DE]: 'Deutsch',
    [Language.JA]: '日本語',
    [Language.KO]: '한국어'
  };

  // 模拟翻译函数
  private simulateTranslation(text: string, sourceLang: Language, targetLang: Language): string {
    // 简单的模拟翻译
    const translations: { [key: string]: { [key in Language]?: string } } = {
      'Eufy Security Camera - Complete Guide': {
        [Language.ZH_CN]: 'Eufy 安防摄像头 - 完整指南',
        [Language.ZH_TW]: 'Eufy 安防攝像頭 - 完整指南',
        [Language.ES]: 'Cámara de Seguridad Eufy - Guía Completa',
        [Language.FR]: 'Caméra de Sécurité Eufy - Guide Complet',
        [Language.DE]: 'Eufy Sicherheitskamera - Vollständiger Leitfaden',
        [Language.JA]: 'Eufy セキュリティカメラ - 完全ガイド',
        [Language.KO]: 'Eufy 보안 카메라 - 완전 가이드'
      }
    };

    // 如果有预定义翻译，使用它
    if (translations[text]?.[targetLang]) {
      return translations[text][targetLang]!;
    }

    // 否则返回模拟翻译
    return `[${this.languageNames[targetLang]}] ${text}`;
  }

  async translateContent(input: TranslateContentInput): Promise<Translation> {
    const translationId = `trans_${Date.now()}`;
    
    // 模拟获取源内容
    const sourceText = `This is sample content for ${input.contentId}. Eufy security cameras provide excellent home protection.`;
    
    const translation: Translation = {
      id: translationId,
      sourceContentId: input.contentId,
      sourceLang: Language.EN,
      targetLang: input.targetLang,
      sourceText,
      translatedText: this.simulateTranslation(sourceText, Language.EN, input.targetLang),
      status: TranslationStatus.COMPLETED,
      quality: 85 + Math.random() * 15, // 85-100
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.translations.set(translationId, translation);
    return translation;
  }

  async batchTranslate(input: BatchTranslateInput): Promise<TranslationBatch> {
    const batchId = `batch_${Date.now()}`;
    
    const batch: TranslationBatch = {
      id: batchId,
      name: input.batchName,
      contentIds: input.contentIds,
      sourceLang: input.sourceLang,
      targetLangs: input.targetLangs,
      progress: 0,
      totalItems: input.contentIds.length * input.targetLangs.length,
      completedItems: 0
    };

    this.batches.set(batchId, batch);

    // 模拟批量翻译过程
    setTimeout(() => {
      batch.completedItems = batch.totalItems;
      batch.progress = 100;
    }, 2000);

    return batch;
  }

  async reviewTranslation(input: ReviewTranslationInput): Promise<Translation> {
    const translation = this.translations.get(input.translationId);
    if (!translation) {
      throw new Error('Translation not found');
    }

    if (input.approved) {
      translation.status = TranslationStatus.REVIEWED;
    } else {
      translation.status = TranslationStatus.IN_PROGRESS;
    }

    translation.reviewNotes = input.reviewNotes;
    if (input.editedText) {
      translation.translatedText = input.editedText;
    }

    translation.updatedAt = new Date().toISOString();
    return translation;
  }

  async getTranslations(contentId?: string): Promise<Translation[]> {
    let translations = Array.from(this.translations.values());
    
    if (contentId) {
      translations = translations.filter(t => t.sourceContentId === contentId);
    }

    return translations;
  }

  async getLanguageStats(): Promise<LanguageStats[]> {
    const stats: LanguageStats[] = [];
    
    for (const lang of Object.values(Language)) {
      const translations = Array.from(this.translations.values())
        .filter(t => t.targetLang === lang);
      
      stats.push({
        language: lang as Language,
        totalContent: translations.length,
        pendingTranslations: translations.filter(t => t.status === TranslationStatus.PENDING).length,
        completedTranslations: translations.filter(t => t.status === TranslationStatus.COMPLETED).length,
        avgQuality: translations.reduce((sum, t) => sum + t.quality, 0) / (translations.length || 1)
      });
    }

    return stats;
  }

  async getSupportedLanguages(): Promise<{ code: Language; name: string }[]> {
    return Object.entries(this.languageNames).map(([code, name]) => ({
      code: code as Language,
      name
    }));
  }
}

// Resolver
@Resolver()
class MultilingualResolver {
  constructor(private multilingualService: MultilingualService) {}

  @Query(() => String)
  async multilingualHealth(): Promise<string> {
    return 'Multilingual module is healthy! 🌍';
  }

  @Mutation(() => Translation)
  async translateContent(
    @Args('input') input: TranslateContentInput
  ): Promise<Translation> {
    return this.multilingualService.translateContent(input);
  }

  @Mutation(() => TranslationBatch)
  async batchTranslate(
    @Args('input') input: BatchTranslateInput
  ): Promise<TranslationBatch> {
    return this.multilingualService.batchTranslate(input);
  }

  @Mutation(() => Translation)
  async reviewTranslation(
    @Args('input') input: ReviewTranslationInput
  ): Promise<Translation> {
    return this.multilingualService.reviewTranslation(input);
  }

  @Query(() => [Translation])
  async translations(
    @Args('contentId', { nullable: true }) contentId?: string
  ): Promise<Translation[]> {
    return this.multilingualService.getTranslations(contentId);
  }

  @Query(() => [LanguageStats])
  async languageStats(): Promise<LanguageStats[]> {
    return this.multilingualService.getLanguageStats();
  }

  @Query(() => [{ code: Language, name: String }])
  async supportedLanguages(): Promise<{ code: Language; name: string }[]> {
    return this.multilingualService.getSupportedLanguages();
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
  providers: [MultilingualService, MultilingualResolver],
})
class MultilingualModule {}

// Bootstrap
async function bootstrap() {
  const app = await NestFactory.create(MultilingualModule);
  
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = 4007;
  await app.listen(port);
  
  console.log(`🚀 Multilingual API running on http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`🌍 Multi-language Support ready!`);
  console.log(`\n🗣️  Supported Languages:`);
  console.log(`   - English (EN)`);
  console.log(`   - 简体中文 (ZH_CN)`);
  console.log(`   - 繁體中文 (ZH_TW)`);
  console.log(`   - Español (ES)`);
  console.log(`   - Français (FR)`);
  console.log(`   - Deutsch (DE)`);
  console.log(`   - 日本語 (JA)`);
  console.log(`   - 한국어 (KO)`);
}

bootstrap();