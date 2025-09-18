import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

// Import simple auth module
import { AuthSimpleModule } from './modules/auth/auth.simple.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema-auth.gql'),
      playground: true,
      introspection: true,
      context: ({ req }: any) => ({ req }),
    }),
    
    // Feature modules
    AuthSimpleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppAuthTestModule {}