import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';
import { PrismaMockService } from '../../common/prisma.mock.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env['JWT_SECRET'] || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
    {
      provide: PrismaService,
      useClass: PrismaMockService,
    },
  ],
  exports: [AuthService],
})
export class AuthMockModule {}