import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ObjectType, Field, InputType } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsString, MinLength } from 'class-validator';

// DTOs
@ObjectType()
class AuthUser {
  @Field()
  id: string = '';

  @Field()
  email: string = '';

  @Field()
  username: string = '';

  @Field()
  role: string = '';
}

@ObjectType()
class AuthResponseType {
  @Field()
  access_token: string = '';

  @Field(() => AuthUser)
  user: AuthUser = new AuthUser();
}

@InputType()
class LoginInputType {
  @Field()
  @IsEmail()
  email: string = '';

  @Field()
  @IsString()
  @MinLength(6)
  password: string = '';
}

@InputType()
class RegisterInputType {
  @Field()
  @IsEmail()
  email: string = '';

  @Field()
  @IsString()
  username: string = '';

  @Field()
  @IsString()
  @MinLength(6)
  password: string = '';
}

// Service
@Injectable()
class AuthTestService {
  private users = new Map<string, any>();

  constructor(private jwtService: JwtService) {
    this.initUsers();
  }

  async initUsers() {
    const hashedPassword = await bcrypt.hash('test123', 10);
    this.users.set('admin@eufy.com', {
      id: 'admin-1',
      email: 'admin@eufy.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    });
  }

  async login(email: string, password: string): Promise<AuthResponseType> {
    const user = this.users.get(email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    const response = new AuthResponseType();
    response.access_token = token;
    response.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    return response;
  }

  async register(email: string, username: string, password: string): Promise<AuthResponseType> {
    if (this.users.has(email)) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      username,
      password: hashedPassword,
      role: 'USER'
    };

    this.users.set(email, newUser);

    const payload = { sub: newUser.id, email: newUser.email, role: newUser.role };
    const token = this.jwtService.sign(payload);

    const response = new AuthResponseType();
    response.access_token = token;
    response.user = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role
    };

    return response;
  }
}

// Resolver
@Resolver()
class AuthTestResolver {
  constructor(private authService: AuthTestService) {}

  @Query(() => String)
  async authHealth(): Promise<string> {
    return 'Auth module is healthy! 🔐';
  }

  @Mutation(() => AuthResponseType)
  async login(@Args('input') input: LoginInputType): Promise<AuthResponseType> {
    return this.authService.login(input.email, input.password);
  }

  @Mutation(() => AuthResponseType)
  async register(@Args('input') input: RegisterInputType): Promise<AuthResponseType> {
    return this.authService.register(input.email, input.username, input.password);
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
    JwtModule.register({
      secret: 'test-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthTestService, AuthTestResolver],
})
class AuthTestModule {}

// Bootstrap
async function bootstrap() {
  const app = await NestFactory.create(AuthTestModule);
  
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = 4003;
  await app.listen(port);
  
  console.log(`🚀 Auth Test API running on http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`🔐 Test credentials: admin@eufy.com / test123`);
}

bootstrap();