import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { GEOModule } from './modules/geo/geo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      introspection: true,
      context: () => ({}),
    }),
    GEOModule
  ]
})
class GEOTestModule {}

async function bootstrap() {
  console.log('🚀 启动 Eufy GEO3 核心服务...');
  
  const app = await NestFactory.create(GEOTestModule);
  
  // 启用CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:4007'],
    credentials: true,
  });

  const port = 4007;
  await app.listen(port);

  console.log(`🔥 GEO3 核心服务已启动！`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`🎯 服务功能:`);
  console.log(`   • GEO内容优化引擎`);
  console.log(`   • AI引用实时监测`);
  console.log(`   • FAQ智能重构系统`);
  console.log(`   • AI引擎兼容性评估`);
  console.log('');
  console.log('📝 可用查询示例:');
  console.log('   query { geoStatus }');
  console.log('   query { geoHealthCheck }');
  console.log('   query { geoCapabilities }');
  console.log('   query { getAICitationInsights }');
  console.log('');
  console.log('💡 可用变更示例:');
  console.log('   mutation { optimizeContentForGEO(...) }');
  console.log('   mutation { optimizeFAQsForGEO(...) }');
}

bootstrap().catch(error => {
  console.error('❌ GEO服务启动失败:', error);
  process.exit(1);
});