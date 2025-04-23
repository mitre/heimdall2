import {
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Post,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {Request} from 'express';
import {ConfigService} from '../config/config.service';
import {AuthenticationExceptionFilter} from '../filters/authentication-exception.filter';
import {LocalAuthGuard} from '../guards/local-auth.guard';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {User} from '../users/user.model';
import {AuthnService} from './authn.service';

@UseInterceptors(LoggingInterceptor)
@Controller('authn')
export class AuthnController {
  private readonly logger = new Logger(AuthnController.name);

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    if (!this.configService.isLocalLoginAllowed()) {
      this.logger.warn('Local login attempt blocked - local login is disabled');
      throw new ForbiddenException(
        'Local user login is disabled. Please disable LOCAL_LOGIN_DISABLED to use this feature.'
      );
    } else {
      this.logger.log(`Local login successful for user: ${(req.user as User).email}`);
      return this.authnService.login(req.user as User);
    }
  }

  @UseGuards(AuthGuard('ldap'))
  @Post('login/ldap')
  async loginToLDAP(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.log(`LDAP login successful for user: ${(req.user as User).email}`);
    return this.authnService.login(req.user as User);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @UseFilters(new AuthenticationExceptionFilter('github'))
  async loginToGithub(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    return this.authnService.login(req.user as User);
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @UseFilters(new AuthenticationExceptionFilter('github'))
  async getUserFromGithubLogin(@Req() req: Request): Promise<void> {
    this.logger.log(`GitHub login successful for user: ${(req.user as User).email}`);
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('gitlab')
  @UseGuards(AuthGuard('gitlab'))
  @UseFilters(new AuthenticationExceptionFilter('gitlab'))
  async loginToGitlab(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    return this.authnService.login(req.user as User);
  }

  @Get('gitlab/callback')
  @UseGuards(AuthGuard('gitlab'))
  @UseFilters(new AuthenticationExceptionFilter('gitlab'))
  async getUserFromGitlabLogin(@Req() req: Request): Promise<void> {
    this.logger.log(`GitLab login successful for user: ${(req.user as User).email}`);
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @UseFilters(new AuthenticationExceptionFilter('google'))
  async loginToGoogle(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    return this.authnService.login(req.user as User);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseFilters(new AuthenticationExceptionFilter('google'))
  async getUserFromGoogle(@Req() req: Request): Promise<void> {
    this.logger.log(`Google login successful for user: ${(req.user as User).email}`);
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('okta')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter('okta'))
  async loginToOkta(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.log(`Initiating Okta login flow`);
    return this.authnService.login(req.user as User);
  }

  @Get('okta/callback')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter('okta'))
  async getUserFromOkta(@Req() req: Request): Promise<void> {
    this.logger.log(`Okta login callback received for user: ${(req.user as User)?.email || 'unknown'}`);
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
    this.logger.log(`Okta login completed successfully for user: ${(req.user as User).email}`);
  }

  @Get('oidc')
  @UseGuards(AuthGuard('oidc'))
  @UseFilters(new AuthenticationExceptionFilter('oidc'))
  async loginToOIDC(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.log(`Initiating OIDC login flow`);
    return this.authnService.login(req.user as User);
  }

  @Get('oidc/callback')
  @UseGuards(AuthGuard('oidc'))
  @UseFilters(new AuthenticationExceptionFilter('oidc'))
  async getUserFromOIDC(@Req() req: Request): Promise<void> {
    this.logger.log(`OIDC login callback received for user: ${(req.user as User)?.email || 'unknown'}`);
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
    this.logger.log(`OIDC login completed successfully for user: ${(req.user as User).email}`);
  }

  async setSessionCookies(
    req: Request,
    session: {
      userID: string;
      accessToken: string;
    }
  ): Promise<void> {
    this.logger.debug(`Setting session cookies for user ID: ${session.userID}`);
    
    // Set secure cookie in production, allow non-secure in development
    const secure = this.configService.isInProductionMode();
    
    // Set user ID cookie
    req.res?.cookie('userID', session.userID, {
      secure: secure,
      httpOnly: false, // Frontend needs to access this
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' // Balances security and usability
    });
    
    // Set access token cookie
    req.res?.cookie('accessToken', session.accessToken, {
      secure: secure,
      httpOnly: false, // Frontend needs to access this
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' // Balances security and usability
    });
    
    // Redirect to home page
    req.res?.redirect('/');
  }
}