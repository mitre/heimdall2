import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { createLogger, format, transports } from 'winston';
import { ConfigService } from '../config/config.service';
import { AuthenticationExceptionFilter } from '../filters/authentication-exception.filter';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { User } from '../users/user.model';
import { AuthnService } from './authn.service';

@UseInterceptors(LoggingInterceptor)
@Controller('authn')
export class AuthnController {
  private readonly line = '_______________________________________________\n';
  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  public logger = createLogger({
    format: format.combine(
      format.timestamp({ format: this.loggingTimeFormat }),
      format.printf(
        info =>
          `${this.line}[${String([info.timestamp])}] (Authn Controller): ${String(info.message)}`,
      ),
    ),
    transports: [new transports.Console()],
  });

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService,
  ) {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGithubLogin(@Req() request: Request): Promise<void> {
    this.logger.debug('in the github login callback func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    const session = await this.authnService.login(request.user as User);
    await this.setSessionCookies(request, session);
  }

  @Get('gitlab/callback')
  @UseGuards(AuthGuard('gitlab'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGitlabLogin(@Req() request: Request): Promise<void> {
    this.logger.debug('in the gitlab login callback func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    const session = await this.authnService.login(request.user as User);
    await this.setSessionCookies(request, session);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromGoogle(@Req() request: Request): Promise<void> {
    this.logger.debug('in the google login callback func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    const session = await this.authnService.login(request.user as User);
    await this.setSessionCookies(request, session);
  }

  @Get('oidc_callback')
  @UseGuards(AuthGuard('oidc'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromOIDC(@Req() request: Request): Promise<void> {
    this.logger.debug('in the oidc login callback func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    const session = await this.authnService.login(request.user as User);
    await this.setSessionCookies(request, session);
  }

  @Get('okta_callback')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter())
  async getUserFromOkta(@Req() request: Request): Promise<void> {
    this.logger.debug('in the okta login callback func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    const session = await this.authnService.login(request.user as User);
    await this.setSessionCookies(request, session);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Req() request: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the local login func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    if (this.configService.isLocalLoginAllowed()) {
      return this.authnService.login(request.user as User);
    }
    throw new ForbiddenException(
      'Local user login is disabled. Please disable LOCAL_LOGIN_DISABLED to use this feature.',
    );
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGithub(
    @Req() request: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the github login func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    return this.authnService.login(request.user as User);
  }

  @Get('gitlab')
  @UseGuards(AuthGuard('gitlab'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGitlab(
    @Req() request: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the gitlab login func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    return this.authnService.login(request.user as User);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToGoogle(
    @Req() request: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the google login func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    return this.authnService.login(request.user as User);
  }

  @UseGuards(AuthGuard('ldap'))
  @Post('login/ldap')
  async loginToLDAP(
    @Req() request: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the ldap login func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    return this.authnService.login(request.user as User);
  }

  @Get('oidc')
  @UseGuards(AuthGuard('oidc'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToOIDC(
    @Req() request: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the oidc login func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    return this.authnService.login(request.user as User);
  }

  @Get('okta')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter())
  async loginToOkta(
    @Req() request: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the okta login func');
    this.logger.debug(JSON.stringify(request.session, null, 2));
    return this.authnService.login(request.user as User);
  }

  async setSessionCookies(
    request: Request,
    session: {
      accessToken: string;
      userID: string;
    },
  ): Promise<void> {
    request.res?.cookie('userID', session.userID, { secure: this.configService.isInProductionMode() });
    request.res?.cookie('accessToken', session.accessToken, { secure: this.configService.isInProductionMode() });
    request.res?.redirect('/');
  }
}
