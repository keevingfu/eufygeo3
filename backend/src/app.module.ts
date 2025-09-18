import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

// Import modules (using simplified module for testing)
import { KeywordModule } from './modules/keyword/keyword.module.simple';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      introspection: true,
      cors: {
        origin: ['http://localhost:3000'],
        credentials: true,
      },
    }),
    
    // Feature modules
    KeywordModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}