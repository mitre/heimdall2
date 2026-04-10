import {IUser} from '@heimdall/common/interfaces';
import {HttpException, Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import jwt from 'jsonwebtoken';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {ConfigService} from '../config/config.service';
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
          done(null, configService.get('JWT_SECRET') + user.jwtSecret);
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
  }): Promise<IUser> {
    return this.usersService.findById(payload.sub);
  }
}
