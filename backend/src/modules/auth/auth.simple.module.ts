import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthSimpleService } from './auth.simple.service';
import { AuthResolver } from './auth.simple.resolver';
import { JwtSimpleStrategy } from './jwt.simple.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env['JWT_SECRET'] || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    AuthSimpleService,
    AuthResolver,
    JwtSimpleStrategy,
  ],
  exports: [AuthSimpleService],
})
export class AuthSimpleModule {}