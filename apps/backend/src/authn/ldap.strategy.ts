import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Request} from 'express';
import * as fs from 'fs';
import * as _ from 'lodash';
import Strategy from 'passport-ldapauth';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';

@Injectable()
export class LDAPStrategy extends PassportStrategy(Strategy, 'ldap') {
  static getSSLConfig(configService: ConfigService) {
    if (
      !configService.get('LDAP_SSL') ||
      configService.get('LDAP_SSL')?.toLowerCase() === 'false'
    ) {
      return false;
    }

    let sslCA: string | Buffer | undefined = configService.get('LDAP_SSL_CA');
    if (!sslCA) {
      throw new Error('SSL CA file or path to file not provided');
    }
    if (sslCA.indexOf('-BEGIN') === -1) {
      if (fs.statSync(sslCA).isFile()) {
        sslCA = fs.readFileSync(sslCA);
        if (sslCA.indexOf('-BEGIN') === -1) {
          throw new Error('SSL CA file at given path was not a certificate');
        }
      } else {
        throw new Error(
          'SSL CA file is neither a certificate nor is it a path to one'
        );
      }
    }

    return {
      rejectUnauthorized:
        configService.get('LDAP_SSL_INSECURE') &&
        configService.get('LDAP_SSL_INSECURE')?.toLowerCase() !== 'true',
      ca: sslCA
    };
  }

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {
    const sslConfig = LDAPStrategy.getSSLConfig(configService);
    super(
      {
        passReqToCallback: true,
        server: {
          url: `${sslConfig ? 'ldaps' : 'ldap'}://${configService.get(
            'LDAP_HOST'
          )}:${configService.get('LDAP_PORT') || 389}`,
          bindDN: configService.get('LDAP_BINDDN'),
          bindCredentials: configService.get('LDAP_PASSWORD'),
          searchBase: configService.get('LDAP_SEARCHBASE') || 'disabled',
          searchFilter:
            configService.get('LDAP_SEARCHFILTER') ||
            '(sAMAccountName={{username}})',
          passReqToCallback: true,
          ...(sslConfig && {
            tlsOptions: {
              rejectUnauthorized: sslConfig.rejectUnauthorized,
              ca: sslConfig.ca
            }
          })
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (req: Request, user: unknown, done: any) => {
        const {firstName, lastName} = this.authnService.splitName(
          _.get(user, configService.get('LDAP_NAMEFIELD') || 'name')
        );
        const email: string = _.get(
          user,
          configService.get('LDAP_MAILFIELD') || 'mail'
        );
        req.user = this.authnService.validateOrCreateUser(
          Array.isArray(email) ? email[0] : email,
          firstName,
          lastName,
          'ldap'
        );
        return done(null, req.user);
      }
    );
  }
}
