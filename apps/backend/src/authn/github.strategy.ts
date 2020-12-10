import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import axios from 'axios';
import {Strategy} from 'passport-github';
import {User} from 'src/users/user.model';
import {UsersService} from 'src/users/users.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private usersService: UsersService) {
    super({
      clientID: process.env.GITHUB_CLIENTID,
      clientSecret: process.env.GITHUB_CLIENTSECRET,
      passReqToCallback: true
    });
  }

  async validate(accessToken: string): Promise<any> {
    const {data} = await axios.get('https://api.github.com/user', {
      headers: {Authorization: `Bearer ${accessToken}`}
    });
    const user = this.usersService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    return User;
  }
}
