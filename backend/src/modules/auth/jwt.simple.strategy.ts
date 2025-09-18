import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthSimpleService } from './auth.simple.service';

@Injectable()
export class JwtSimpleStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthSimpleService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.getUserById(payload.sub);
    return user;
  }
}