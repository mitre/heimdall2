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

// Constants for logging contexts to avoid duplication
const CONTEXT_OKTA_LOGIN = 'AuthnController.loginToOkta';
const CONTEXT_OKTA_CALLBACK = 'AuthnController.getUserFromOkta';
const CONTEXT_OIDC_CALLBACK = 'AuthnController.getUserFromOIDC';
const CONTEXT_SESSION_COOKIES = 'AuthnController.setSessionCookies';

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
      this.logger.log(
        `Local login successful for user: ${(req.user as User).email}`
      );
      return this.authnService.login(req.user as User);
    }
  }

  @UseGuards(AuthGuard('ldap'))
  @Post('login/ldap')
  async loginToLDAP(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.log(
      `LDAP login successful for user: ${(req.user as User).email}`
    );
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
    this.logger.log(
      `GitHub login successful for user: ${(req.user as User).email}`
    );
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
    this.logger.log(
      `GitLab login successful for user: ${(req.user as User).email}`
    );
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
    this.logger.log(
      `Google login successful for user: ${(req.user as User).email}`
    );
    const session = await this.authnService.login(req.user as User);
    await this.setSessionCookies(req, session);
  }

  @Get('okta')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter('okta'))
  async loginToOkta(
    @Req() req: Request
  ): Promise<{userID: string; accessToken: string}> {
    this.logger.verbose(`Initiating Okta login flow`, {
      context: CONTEXT_OKTA_LOGIN,
      ipAddress: req.ip ?? req.connection?.remoteAddress ?? 'unknown',
      userAgent: req.headers?.['user-agent'] ?? 'unknown'
    });
    return this.authnService.login(req.user as User);
  }

  @Get('okta/callback')
  @UseGuards(AuthGuard('okta'))
  @UseFilters(new AuthenticationExceptionFilter('okta'))
  async getUserFromOkta(@Req() req: Request): Promise<void> {
    try {
      const userEmail = (req.user as User)?.email || 'unknown';
      this.logger.log(`Okta login callback received`, {
        user: userEmail,
        context: CONTEXT_OKTA_CALLBACK
      });

      const session = await this.authnService.login(req.user as User);
      await this.setSessionCookies(req, session);

      this.logger.log(`Okta login completed successfully`, {
        user: userEmail,
        context: CONTEXT_OKTA_CALLBACK
      });
    } catch (error) {
      this.logger.error(
        `Error during Okta callback processing: ${error.message}`,
        {
          stack: error.stack,
          context: CONTEXT_OKTA_CALLBACK
        }
      );
      throw error; // Let the exception filter handle this
    }
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
    try {
      const userEmail = (req.user as User)?.email || 'unknown';
      this.logger.log(`OIDC login callback received`, {
        user: userEmail,
        context: CONTEXT_OIDC_CALLBACK
      });

      const session = await this.authnService.login(req.user as User);
      await this.setSessionCookies(req, session);

      this.logger.log(`OIDC login completed successfully`, {
        user: userEmail,
        context: CONTEXT_OIDC_CALLBACK
      });
    } catch (error) {
      this.logger.error(
        `Error during OIDC callback processing: ${error.message}`,
        {
          stack: error.stack,
          context: CONTEXT_OIDC_CALLBACK
        }
      );
      throw error; // Let the exception filter handle this
    }
  }

  async setSessionCookies(
    req: Request,
    session: {
      userID: string;
      accessToken: string;
    }
  ): Promise<void> {
    // Import the utility function for generating correlation IDs
    const {generateCorrelationId} = await import(
      '../utils/correlation-id.util'
    );

    // Generate correlation ID for this session setup
    const correlationId = generateCorrelationId('session');

    this.logger.debug(`Setting session cookies`, {
      userID: session.userID,
      context: CONTEXT_SESSION_COOKIES,
      correlationId
    });

    if (!req.res) {
      this.logger.error('Response object is undefined, cannot set cookies', {
        context: CONTEXT_SESSION_COOKIES,
        correlationId
      });
      throw new Error('Response object is undefined');
    }

    // Set secure cookie in production, allow non-secure in development
    const secure = this.configService.isInProductionMode();

    // Use configurable session max age (default 24 hours)
    const maxAgeStr = this.configService.get('OKTA_SESSION_MAXAGE');
    let maxAge = maxAgeStr ? parseInt(maxAgeStr, 10) : 24 * 60 * 60 * 1000; // Default to 24 hours
    if (Number.isNaN(maxAge)) {
      this.logger.warn('Invalid OKTA_SESSION_MAXAGE value, using default', {
        context: CONTEXT_SESSION_COOKIES,
        receivedValue: maxAgeStr
      });
      maxAge = 24 * 60 * 60 * 1000; // Fallback to default value if parseInt result is NaN
    }

    // Get configurable sameSite setting
    const sameSite = this.configService.get('OKTA_COOKIE_SAMESITE') ?? 'lax';

    // Get configurable httpOnly setting (default false to allow frontend access)
    const httpOnly =
      this.configService.get('OKTA_COOKIE_HTTP_ONLY')?.toLowerCase() === 'true';

    // Get configurable redirect path (default to home)
    const redirectPath =
      this.configService.get('OKTA_REDIRECT_AFTER_LOGIN') ?? '/';

    try {
      // Set user ID cookie
      req.res.cookie('userID', session.userID, {
        secure,
        httpOnly,
        maxAge,
        sameSite: sameSite as 'lax' | 'strict' | 'none'
      });

      // Set access token cookie
      req.res.cookie('accessToken', session.accessToken, {
        secure,
        httpOnly,
        maxAge,
        sameSite: sameSite as 'lax' | 'strict' | 'none'
      });

      // Redirect to configured path
      req.res.redirect(redirectPath);

      this.logger.debug('Session cookies set successfully', {
        context: CONTEXT_SESSION_COOKIES,
        correlationId,
        maxAge,
        sameSite,
        redirectPath
      });
    } catch (error) {
      this.logger.error(`Failed to set session cookies: ${error.message}`, {
        stack: error.stack,
        context: CONTEXT_SESSION_COOKIES,
        correlationId
      });
      throw error;
    }
  }
}
