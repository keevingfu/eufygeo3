import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field()
  role: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class AuthResponse {
  @Field()
  access_token: string;

  @Field(() => User)
  user: User;
}

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;
}

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  username: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;
}