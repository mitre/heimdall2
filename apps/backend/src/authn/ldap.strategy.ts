import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import _ from 'lodash';
import Strategy from 'passport-ldapauth';
import { resolveSslMaterial } from '../../config/app-config';
import { ConfigService } from '../config/config.service';
import type { User } from '../users/user.model';
import { AuthnService } from './authn.service';

@Injectable()
export class LDAPStrategy extends PassportStrategy(Strategy, 'ldap') {
  static getSSLConfig(configService: ConfigService) {
    const isSslEnabled
      = (configService.get('LDAP_SSL') ?? '').toLowerCase() === 'true';
    if (!isSslEnabled) {
      return false;
    }

    let sslCA: Buffer | string | undefined = configService.get('LDAP_SSL_CA');
    if (!sslCA) {
      throw new Error('SSL CA file or path to file not provided');
    }
    if (!sslCA.includes('-BEGIN')) {
      sslCA = resolveSslMaterial(sslCA, 'CA');
      if (!sslCA.includes('-BEGIN')) {
        throw new Error('SSL CA file at given path was not a certificate');
      }
    }

    const isSslInsecure
      = (configService.get('LDAP_SSL_INSECURE') ?? '').toLowerCase() === 'true';

    return {
      ca: sslCA,
      rejectUnauthorized: !isSslInsecure,
    };
  }

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService,
  ) {
    const sslConfig = LDAPStrategy.getSSLConfig(configService);
    super({
      server: {
        bindCredentials: configService.get('LDAP_PASSWORD'),
        bindDN: configService.get('LDAP_BINDDN'),
        searchBase: configService.get('LDAP_SEARCHBASE') || 'disabled',
        searchFilter:
          configService.get('LDAP_SEARCHFILTER')
          || '(sAMAccountName={{username}})',
        url: `${sslConfig ? 'ldaps' : 'ldap'}://${configService.get(
          'LDAP_HOST',
        )}:${configService.get('LDAP_PORT') || '389'}`,
        ...(sslConfig && {
          tlsOptions: {
            ca: sslConfig.ca,
            rejectUnauthorized: sslConfig.rejectUnauthorized,
          },
        }),
      },
    });
  }

  // The PassportStrategy mixin awaits this and hands the resolved user to
  // passport's done() itself — the contract every sibling strategy follows.
  // Calling done() here directly passed the UNAWAITED promise as req.user
  // and fired done() a second time when the mixin completed.
  validate(user: unknown): Promise<User> {
    const { firstName, lastName } = this.authnService.splitName(
      _.get(user, this.configService.get('LDAP_NAMEFIELD') || 'name'),
    );
    const email: string = _.get(
      user,
      this.configService.get('LDAP_MAILFIELD') || 'mail',
    );
    return this.authnService.validateOrCreateUser(
      // `.at(0)` returns `string | undefined`, but validateOrCreateUser
      // requires `string`. Index access keeps the exact runtime behavior this
      // has always had. Closing the gap properly means deciding what should
      // happen when an LDAP user has no email address — an authentication
      // behavior change, not a lint fix. Tracked separately.
      // eslint-disable-next-line unicorn/prefer-at
      Array.isArray(email) ? email[0] : email,
      firstName,
      lastName,
      'ldap',
    );
  }
}
