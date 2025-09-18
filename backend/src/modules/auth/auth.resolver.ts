import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponse, LoginInput, RegisterInput, User } from './dto/auth.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { GqlAuthGuard } from './guards/gql-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    return this.authService.login(input.email, input.password);
  }

  @Mutation(() => AuthResponse)
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    return this.authService.register(
      input.email,
      input.username,
      input.password,
    );
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async currentUser(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}