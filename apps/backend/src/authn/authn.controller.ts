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
import winston from 'winston';
import { ConfigService } from '../config/config.service';
import { AuthenticationExceptionFilter } from '../filters/authentication-exception.filter';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { User } from '../users/user.model';
import { AuthnService } from './authn.service';

@Controller('authn')
@UseInterceptors(LoggingInterceptor)
export class AuthnController {
  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  private readonly line = '_______________________________________________\n';
  public logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp({ format: this.loggingTimeFormat }),
      winston.format.printf(
        info =>
          `${this.line}[${[info.timestamp]}] (Authn Controller): ${info.message}`,
      ),
    ),
    transports: [new winston.transports.Console()],
  });

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService,
  ) {}

  @Get('github/callback')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('github'))
  async getUserFromGithubLogin(@Req() req: Request): Promise<void> {
    this.logger.debug('in the github login callback func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('gitlab/callback')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('gitlab'))
  async getUserFromGitlabLogin(@Req() req: Request): Promise<void> {
    this.logger.debug('in the gitlab login callback func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('google/callback')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('google'))
  async getUserFromGoogle(@Req() req: Request): Promise<void> {
    this.logger.debug('in the google login callback func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('oidc_callback')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('oidc'))
  async getUserFromOIDC(@Req() req: Request): Promise<void> {
    this.logger.debug('in the oidc login callback func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('okta_callback')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('okta'))
  async getUserFromOkta(@Req() req: Request): Promise<void> {
    this.logger.debug('in the okta login callback func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Post('saml/callback')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('saml'))
  async getUserFromSAML(@Req() req: Request): Promise<void> {
    this.logger.debug('in the saml login callback func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @Req() req: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the local login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    if (this.configService.isLocalLoginAllowed()) {
      return this.authnService.login(req.user as User);
    } else {
      throw new ForbiddenException(
        'Local user login is disabled. Please disable LOCAL_LOGIN_DISABLED to use this feature.',
      );
    }
  }

  @Get('github')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('github'))
  async loginToGithub(
    @Req() req: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the github login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Get('gitlab')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('gitlab'))
  async loginToGitlab(
    @Req() req: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the gitlab login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Get('google')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('google'))
  async loginToGoogle(
    @Req() req: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the google login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Post('login/ldap')
  @UseGuards(AuthGuard('ldap'))
  async loginToLDAP(
    @Req() req: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the ldap login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Get('oidc')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('oidc'))
  async loginToOIDC(
    @Req() req: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the oidc login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Get('okta')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('okta'))
  async loginToOkta(
    @Req() req: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the okta login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  @Get('saml')
  @UseFilters(new AuthenticationExceptionFilter())
  @UseGuards(AuthGuard('saml'))
  async loginToSAML(
    @Req() req: Request,
  ): Promise<{ accessToken: string; userID: string }> {
    this.logger.debug('in the saml login func');
    this.logger.debug(JSON.stringify(req.session, null, 2));
    return this.authnService.login(req.user as User);
  }

  async setSessionCookies(
    req: Request,
    session: {
      accessToken: string;
      userID: string;
    },
  ): Promise<void> {
    req.res?.cookie('userID', session.userID, { secure: this.configService.isInProductionMode() });
    req.res?.cookie('accessToken', session.accessToken, { secure: this.configService.isInProductionMode() });
    req.res?.redirect('/');
  }
}
