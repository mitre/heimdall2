import {
  Controller,
  Get,
  Post,
  Req,
  UseFilters,
  UseGuards
} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {Request} from 'express';
import {AuthenticationExceptionFilter} from '../filters/authentication-exception.filter';
import {LocalAuthGuard} from '../guards/local-auth.guard';
import {LoggingService} from '../logging/logging.service';
import {User} from '../users/user.model';
import {AuthnService} from './authn.service';

@Controller('authn')
export class AuthnController {
  constructor(
    private readonly authnService: AuthnService,
    private readonly loggingService: LoggingService
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.loggingService.logAuthenticationAction(
      req,
      'Succeded Login As',
      req.user as User
    );
    return this.authnService.login(req.user as User);
  }

  @UseGuards(AuthGuard('ldap'))
  @Post('login/ldap')
  async loginToLDAP(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.loggingService.logAuthenticationAction(
      req,
      'Succeded LDAP Login As',
      req.user as User
    );
    return this.authnService.login(req.user as User);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGithub(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    return this.authnService.login(req.user as User);
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGithubLogin(@Req() req: Request): Promise<void> {
    const session = await this.authnService.login(req.user as User);
    this.loggingService.logAuthenticationAction(
      req,
      'Succeded Github Oauth Login As',
      req.user as User
    );
    await this.setSessionCookies(req, session);
  }

  @Get('gitlab')
  @UseGuards(AuthGuard('gitlab'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGitlab(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    return this.authnService.login(req.user as User);
  }

  @Get('gitlab/callback')
  @UseGuards(AuthGuard('gitlab'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGitlabLogin(@Req() req: Request): Promise<void> {
    const session = await this.authnService.login(req.user as User);
    this.loggingService.logAuthenticationAction(
      req,
      'Succeded Gitlab Oauth Login As',
      req.user as User
    );
    await this.setSessionCookies(req, session);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGoogle(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    return this.authnService.login(req.user as User);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGoogle(@Req() req: Request): Promise<void> {
    const session = await this.authnService.login(req.user as User);
    this.loggingService.logAuthenticationAction(
      req,
      'Succeded Google Oauth Login As',
      req.user as User
    );
    await this.setSessionCookies(req, session);
  }

  @Get('okta')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToOkta(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    return this.authnService.login(req.user as User);
  }

  @Get('okta/callback')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromOkta(@Req() req: Request): Promise<void> {
    const session = await this.authnService.login(req.user as User);
    this.loggingService.logAuthenticationAction(
      req,
      'Succeded Okta Oauth Login As',
      req.user as User
    );
    await this.setSessionCookies(req, session);
  }

  @Get('oidc')
  @UseGuards(AuthGuard('oidc'))
  async loginToOIDC(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    return this.authnService.login(req.user as User);
  }

  @Get('oidc/callback')
  @UseGuards(AuthGuard('oidc'))
  async getUserFromOIDC(@Req() req: Request): Promise<void> {
    const session = await this.authnService.login(req.user as User);
    this.loggingService.logAuthenticationAction(
      req,
      'Succeded OIDC Login As',
      req.user as User
    );
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
