import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseFilters,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {AllowAnonymous} from '@thallesp/nestjs-better-auth';
import {Request} from 'express';
import winston from 'winston';
import {ConfigService} from '../config/config.service';
import {AuthenticationExceptionFilter} from '../filters/authentication-exception.filter';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {AuthnService, type LoginUser} from './authn.service';

@UseInterceptors(LoggingInterceptor)
@AllowAnonymous()
@Controller('authn')
export class AuthnController {
  private readonly line = '_______________________________________________\n';
  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  public logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp({
        format: this.loggingTimeFormat
      }),
      winston.format.printf(
        (info) =>
          `${this.line}[${[info.timestamp]}] (Authn Controller): ${info.message}`
      )
    )
  });

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {}

  @Post('login')
  async login(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the local login func');
    if (!this.configService.isLocalLoginAllowed()) {
      throw new ForbiddenException(
        'Local user login is disabled. Please disable LOCAL_LOGIN_DISABLED to use this feature.'
      );
    }
    const body = req.body as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    const user = await this.authnService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Incorrect Username or Password');
    }
    const baResponse = await this.authnService.createBetterAuthSession(email, password);
    if (baResponse) {
      return {userID: user.id, accessToken: baResponse.token};
    }
    return this.authnService.login({
      id: user.id,
      email: user.email,
      role: user.role,
      forcePasswordChange: user.forcePasswordChange ?? undefined,
    });
  }

  @UseGuards(AuthGuard('ldap'))
  @Post('login/ldap')
  async loginToLDAP(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the ldap login func');
    return this.authnService.login(req.user as LoginUser);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGithub(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the github login func');
    return this.authnService.login(req.user as LoginUser);
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGithubLogin(@Req() req: Request): Promise<void> {
    this.logger.debug('in the github login callback func');
    const session = await this.authnService.login(req.user as LoginUser);
    await this.setSessionCookies(req, session);
  }

  @Get('gitlab')
  @UseGuards(AuthGuard('gitlab'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGitlab(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the gitlab login func');
    return this.authnService.login(req.user as LoginUser);
  }

  @Get('gitlab/callback')
  @UseGuards(AuthGuard('gitlab'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGitlabLogin(@Req() req: Request): Promise<void> {
    this.logger.debug('in the gitlab login callback func');
    const session = await this.authnService.login(req.user as LoginUser);
    await this.setSessionCookies(req, session);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGoogle(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the google login func');
    return this.authnService.login(req.user as LoginUser);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGoogle(@Req() req: Request): Promise<void> {
    this.logger.debug('in the google login callback func');
    const session = await this.authnService.login(req.user as LoginUser);
    await this.setSessionCookies(req, session);
  }

  @Get('okta')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToOkta(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the okta login func');
    return this.authnService.login(req.user as LoginUser);
  }

  @Get('okta_callback')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromOkta(@Req() req: Request): Promise<void> {
    this.logger.debug('in the okta login callback func');
    const session = await this.authnService.login(req.user as LoginUser);
    await this.setSessionCookies(req, session);
  }

  @Get('oidc')
  @UseGuards(AuthGuard('oidc'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToOIDC(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the oidc login func');
    return this.authnService.login(req.user as LoginUser);
  }

  @Get('oidc_callback')
  @UseGuards(AuthGuard('oidc'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromOIDC(@Req() req: Request): Promise<void> {
    this.logger.debug('in the oidc login callback func');
    const session = await this.authnService.login(req.user as LoginUser);
    await this.setSessionCookies(req, session);
  }

  async setSessionCookies(
    req: Request,
    session: {
      userID: string;
      accessToken: string;
    }
  ): Promise<void> {
    const cookieOpts = {
      secure: this.configService.isInProductionMode(),
      sameSite: 'lax' as const,
      httpOnly: true,
    };
    req.res?.cookie('userID', session.userID, cookieOpts);
    req.res?.cookie('accessToken', session.accessToken, cookieOpts);
    req.res?.redirect('/');
  }
}
