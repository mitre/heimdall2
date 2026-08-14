import { IUser } from '@heimdall/common/interfaces';
import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { decode } from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../config/config.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (
        _request: Express.Request,
        jwtToken: string,
        done: (exception: HttpException | null, secret?: string) => unknown,
      ) => {
        // Callback-style API: the lookup reports its outcome through done(),
        // so the promise is deliberately not handed back to passport, which
        // would neither await nor catch it.
        void (async () => {
          const decodedToken = decode(jwtToken) as { sub: string };
          try {
            const user = await usersService.findById(decodedToken.sub);
            done(null, configService.get('JWT_SECRET') + user.jwtSecret);
          } catch {
            done(
              new UnauthorizedException(
                'An exception occurred while validating your session',
              ),
            );
          }
        })();
      },
    });
  }

  async validate(payload: {
    email: string;
    role: string;
    sub: string;
  }): Promise<IUser> {
    return this.usersService.findById(payload.sub);
  }
}
