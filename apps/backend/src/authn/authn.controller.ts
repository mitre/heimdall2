import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {Request} from 'express';
import winston from 'winston';
import {ConfigService} from '../config/config.service';
import {AuthenticationExceptionFilter} from '../filters/authentication-exception.filter';
import {LocalAuthGuard} from '../guards/local-auth.guard';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {User} from '../users/user.model';
import {AuthnService} from './authn.service';
import 'express-session';
declare module 'express-session' {
  interface SessionData {
    redirectLogin?: string;
  }
}
@UseInterceptors(LoggingInterceptor)
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

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the local login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    if (!this.configService.isLocalLoginAllowed()) {
      throw new ForbiddenException(
        'Local user login is disabled. Please disable LOCAL_LOGIN_DISABLED to use this feature.'
      );
    } else {
      return this.authnService.login(req.user as User);
    }
  }

  @UseGuards(AuthGuard('ldap'))
  @Post('login/ldap')
  async loginToLDAP(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the ldap login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGithub(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the github login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGithubLogin(@Req() req: Request): Promise<void> {
    this.logger.debug('in the github login callback func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    const session = await this.authnService.login(req.user as User);
    const redirectTarget =
      typeof req.session.redirectLogin === 'string' &&
      req.session.redirectLogin.startsWith('/')
        ? req.session.redirectLogin
        : undefined;

    delete req.session.redirectLogin;

    await this.setSessionCookies(req, session, redirectTarget);
  }

  @Get('gitlab')
  @UseGuards(AuthGuard('gitlab'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGitlab(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the gitlab login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Get('gitlab/callback')
  @UseGuards(AuthGuard('gitlab'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGitlabLogin(@Req() req: Request): Promise<void> {
    this.logger.debug('in the gitlab login callback func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGoogle(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the google login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGoogle(@Req() req: Request): Promise<void> {
    this.logger.debug('in the google login callback func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('okta')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToOkta(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the okta login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Get('okta_callback')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromOkta(@Req() req: Request): Promise<void> {
    this.logger.debug('in the okta login callback func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('oidc')
  @UseGuards(AuthGuard('oidc'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToOIDC(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.debug('in the oidc login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Get('oidc_callback')
  @UseGuards(AuthGuard('oidc'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromOIDC(@Req() req: Request): Promise<void> {
    this.logger.debug('in the oidc login callback func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    const session = await this.authnService.login(req.user as User);
    const redirectTarget =
      typeof req.session.redirectLogin === 'string' &&
      req.session.redirectLogin.startsWith('/')
        ? req.session.redirectLogin
        : undefined;

    delete req.session.redirectLogin;

    await this.setSessionCookies(req, session, redirectTarget);
  }

  async setSessionCookies(
    req: Request,
    session: {
      userID: string;
      accessToken: string;
    },
    redirectTarget?: string
  ): Promise<void> {
    req.res?.cookie('userID', session.userID, {
      secure: this.configService.isInProductionMode()
    });
    req.res?.cookie('accessToken', session.accessToken, {
      secure: this.configService.isInProductionMode()
    });
    req.res?.redirect(redirectTarget || '/');
  }
}
