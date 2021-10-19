import {IUser} from '@heimdall/interfaces';
import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';
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
        done: (exception: null, user: string) => unknown
      ) => {
        const decodedToken = jwt.decode(jwtToken) as {
          sub: string;
        };
        const user = await usersService.findById(decodedToken.sub);
        done(null, configService.get('JWT_SECRET') + user.jwtSecret);
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
