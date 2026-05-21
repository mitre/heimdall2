import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Profile } from '@node-saml/passport-saml';
import { Strategy } from '@node-saml/passport-saml';
import winston from 'winston';
import { ConfigService } from '../config/config.service';
import { User } from '../users/user.model';
import { AuthnService } from './authn.service';

type SAMLProfile = Profile & {
  email: string;
  firstName: string;
  lastName: string;
};

// dependency injection makes it modular so that it is recyclable and we can pass in fake data for testing along with real data
@Injectable()
// basic logging stolen from other strategies
export class SAMLStrategy extends PassportStrategy(Strategy as any, 'saml') {
  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  private readonly line = '_______________________________________________\n';
  public logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp({ format: this.loggingTimeFormat }),
      winston.format.printf(
        info =>
          `${this.line}[${[info.timestamp]}] (Authn Service): ${info.message}`,
      ),
    ),
    transports: [new winston.transports.Console()],
  });

  // the constructor runs when a new object gets created
  constructor(
    // need authn for turning profile into heimdall user, config for reading config, the rest are added as developed
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService,
  ) {
    // super calls the contructor of the parent class and gives parent its config
    // set to undefined to library default can apply, we set disabled for required vars to avoid crashing from missing env vars
    super({
      audience:
        configService.get('SAML_AUDIENCE')
        || configService.get('SAML_ISSUER'),
      callbackUrl: `${configService.getExternalUrl()}/authn/saml/callback`,
      entryPoint: configService.get('SAML_ENTRY_POINT') || 'disabled',
      identifierFormat:
        configService.get('SAML_IDENTIFIER_FORMAT'),
      idpCert: configService.get('SAML_IDP_CERT') || 'disabled',
      idpIssuer: configService.get('SAML_IDP_ISSUER'),
      issuer: configService.get('SAML_ISSUER') || 'disabled',
    });
  }

  async validate(profile: SAMLProfile): Promise<User> {
    this.logger.debug('in saml strategy file');
    this.logger.debug(JSON.stringify(profile, null, 2));
    const { email, firstName, lastName } = profile;
    if (email.length > 0) {
      return this.authnService.validateOrCreateUser(
        email,
        firstName,
        lastName,
        'saml',
      );
    }
    throw new UnauthorizedException('Incorrect Username or Password');
  }
}
