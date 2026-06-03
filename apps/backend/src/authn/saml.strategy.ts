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

function samlBooleanConfigValue(value: string | undefined): boolean | undefined {
  const normalizedValue = value?.trim().toLowerCase();
  if (!normalizedValue) {
    return undefined;
  }

  if (normalizedValue !== 'true' && normalizedValue !== 'false') {
    throw new TypeError('SAML boolean config values must be "true" or "false"');
  }

  return normalizedValue === 'true';
}

@Injectable()
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

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService,
  ) {
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
      wantAssertionsSigned: samlBooleanConfigValue(configService.get('SAML_WANT_ASSERTIONS_SIGNED')),
      wantAuthnResponseSigned: samlBooleanConfigValue(configService.get('SAML_WANT_AUTHN_RESPONSE_SIGNED')),
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
