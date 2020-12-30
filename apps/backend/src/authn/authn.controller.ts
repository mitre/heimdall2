import {Controller, Get, Post, Req, UseGuards} from '@nestjs/common';
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

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async loginToGithub(@Req() req: Request): Promise<any> {
    return this.authnService.login(req.user as User);
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async getUserFromGithubLogin(@Req() req: Request): Promise<any> {
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('gitlab')
  @UseGuards(AuthGuard('gitlab'))
  async loginToGitlab(@Req() req: Request): Promise<any> {
    return this.authnService.login(req.user as User);
  }

  @Get('gitlab/callback')
  @UseGuards(AuthGuard('gitlab'))
  async getUserFromGitlabLogin(@Req() req: Request): Promise<any> {
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async loginToGoogle(@Req() req: Request): Promise<any> {
    return this.authnService.login(req.user as User);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async getUserFromGoogle(@Req() req: Request): Promise<any> {
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('okta')
  @UseGuards(AuthGuard('okta'))
  async loginToOkta(@Req() req: Request): Promise<any> {
    return this.authnService.login(req.user as User);
  }

  @Get('okta/callback')
  @UseGuards(AuthGuard('okta'))
  async getUserFromOkta(@Req() req: Request): Promise<any> {
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  async setSessionCookies(
    req: Request,
    session: {
      userID: string;
      accessToken: string;
    }
  ): Promise<void> {
    req.res?.cookie('userID', session.userID);
    req.res?.cookie('accessToken', session.accessToken);
    req.res?.redirect('/');
  }
}
