import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from '@govtechsg/passport-openidconnect';
import {HttpsProxyAgent} from 'https-proxy-agent';
import winston from 'winston';
import {ConfigService} from '../config/config.service';
import {GroupsService} from '../groups/groups.service';
import {AuthnService} from './authn.service';
import {Request} from 'express';
import 'express-session';
declare module 'express-session' {
  interface SessionData {
    redirectLogin?: string;
  }
}

interface OIDCProfile {
  id: string;
  displayName: string;
  name: {familyName: string; givenName: string};
  emails: [{value: string}];
  _raw: string;
  _json: {
    given_name: string;
    family_name: string;
    email: string;
    email_verified: boolean;
    groups: string[];
  };
}

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  authenticate(req: Request, options: Record<string, unknown> = {}) {
    const redirect =
      typeof req.query?.redirect === 'string' &&
      req.query.redirect.startsWith('/')
        ? req.query.redirect
        : undefined;
    if (redirect) {
      super.authenticate(req, {
        ...options,
        state: encodeURIComponent(redirect)
      });
      return;
    }
    super.authenticate(req);
  }

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
          `${this.line}[${[info.timestamp]}] (Authn Service): ${info.message}`
      )
    )
  });

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService,
    private readonly groupsService: GroupsService
  ) {
    super(
      {
        issuer: configService.get('OIDC_ISSUER') || 'disabled',
        authorizationURL:
          configService.get('OIDC_AUTHORIZATION_URL') || 'disabled',
        tokenURL: configService.get('OIDC_TOKEN_URL') || 'disabled',
        userInfoURL: configService.get('OIDC_USER_INFO_URL') || 'disabled',
        clientID: configService.get('OIDC_CLIENTID') || 'disabled',
        clientSecret: configService.get('OIDC_CLIENT_SECRET') || 'disabled',
        callbackURL: `${configService.get('EXTERNAL_URL')}/authn/oidc_callback`,
        pkce:
          configService.get('OIDC_USES_PKCE_S256') === 'true'
            ? 'S256'
            : configService.get('OIDC_USES_PKCE_PLAIN') === 'true'
              ? 'plain'
              : undefined,
        scope: ['openid', 'email', 'profile'],
        skipUserProfile: false,
        proxy:
          configService.get('OIDC_USE_HTTPS_PROXY') === 'true'
            ? true
            : undefined,
        agent:
          configService.get('OIDC_USE_HTTPS_PROXY') === 'true'
            ? new HttpsProxyAgent(configService.get('HTTPS_PROXY') ?? '')
            : undefined
      },
      // using the 9-arity function so that we can access the underlying JSON response and extract the 'email_verified' attribute
      async (
        req: Request,
        _issuer: string,
        uiProfile: OIDCProfile,
        _idProfile: object,
        _context: object,
        _idToken: string,
        _accessToken: string,
        _refreshToken: string,
        _params: object,
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        done: any
      ) => {
        const redirectLogin =
          typeof req.query?.state === 'string'
            ? decodeURIComponent(req.query.state as string)
            : undefined;

        if (redirectLogin?.startsWith('/')) {
          req.session.redirectLogin = redirectLogin;
        }

        this.logger.debug('in oidc strategy file');
        this.logger.debug(JSON.stringify(uiProfile, null, 2));
        const userData = uiProfile._json;
        const {given_name, family_name, email, email_verified, groups} =
          userData;
        if (
          configService.get('OIDC_USES_VERIFIED_EMAIL') === 'false' ||
          email_verified
        ) {
          const user = await authnService.validateOrCreateUser(
            email,
            given_name,
            family_name,
            'oidc'
          );

          if (
            configService.get('OIDC_EXTERNAL_GROUPS') === 'true' &&
            groups !== undefined
          ) {
            await groupsService.syncUserGroups(user, groups);
          }

          return done(null, user);
        }
        return done(
          new UnauthorizedException(
            'Please verify your name and email with your identity provider before logging into Heimdall.'
          )
        );
      }
    );
  }
}
