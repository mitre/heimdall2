import {createHmac} from 'crypto';
import {HttpException, Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import jwt from 'jsonwebtoken';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {ConfigService} from '../config/config.service';
import type {SelectUser} from '../db/zod-schemas';
import {UsersService} from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: async (
        _request: Express.Request,
        jwtToken: string,
        done: (exception: null | HttpException, secret?: string) => unknown
      ) => {
        const decodedToken = jwt.decode(jwtToken) as {
          sub: string;
        };
        try {
          const user = await usersService.findById(decodedToken.sub);
          done(null, createHmac('sha256', configService.get('JWT_SECRET') || '').update(user.jwtSecret ?? '').digest('hex'));
        } catch {
          done(
            new UnauthorizedException(
              'An exception occurred while validating your session'
            )
          );
        }
      },
      ignoreExpiration: false
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
  }): Promise<SelectUser> {
    return this.usersService.findById(payload.sub);
  }
}
