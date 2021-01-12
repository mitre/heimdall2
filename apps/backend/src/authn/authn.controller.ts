import {Controller, Post, Req, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {Request} from 'express';
import {LocalAuthGuard} from '../guards/local-auth.guard';
import {User} from '../users/user.model';
import {AuthnService} from './authn.service';

@Controller('authn')
export class AuthnController {
  constructor(private authnService: AuthnService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request): Promise<any> {
    return this.authnService.login(req.user as User);
  }

  @UseGuards(AuthGuard('ldap'))
  @Post('login/ldap')
  async loginToLDAP(@Req() req: Request): Promise<any> {
    return this.authnService.login(req.user as User);
  }
}
