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

    let sslKey, sslCert, sslCA;

    if (typeof configService.get('LDAP_SSL_KEY') === 'string') {
      if (configService.get('LDAP_SSL_KEY')?.indexOf('-BEGIN') !== -1) {
        sslKey = configService.get('LDAP_SSL_KEY');
      } else {
        // Verify file exists
        if (fs.statSync(configService.get('LDAP_SSL_KEY')!).isFile()) {
          sslKey = fs.readFileSync(configService.get('LDAP_SSL_KEY')!);
        } else {
          throw new Error('SSL Key file does not exist');
        }
      }
    }

    if (typeof configService.get('LDAP_SSL_CERT') === 'string') {
      if (configService.get('LDAP_SSL_CERT')?.indexOf('-BEGIN') !== -1) {
        sslCert = configService.get('LDAP_SSL_CERT');
      } else {
        // Verify file exists
        if (fs.statSync(configService.get('LDAP_SSL_CERT')!).isFile()) {
          sslCert = fs.readFileSync(configService.get('LDAP_SSL_CERT')!);
        } else {
          throw new Error('SSL Cert file does not exist');
        }
      }
    }

    if (typeof configService.get('LDAP_SSL_CA') === 'string') {
      if (configService.get('LDAP_SSL_CA')?.indexOf('-BEGIN') !== -1) {
        sslCA = configService.get('LDAP_SSL_CA');
      } else {
        // Verify file exists
        if (fs.statSync(configService.get('LDAP_SSL_CA')!).isFile()) {
          sslCA = fs.readFileSync(configService.get('LDAP_SSL_CA')!);
        } else {
          throw new Error('SSL CA file does not exist');
        }
      }
    }

    return {
      rejectUnauthorized:
        configService.get('LDAP_SSL_INSECURE') &&
        configService.get('LDAP_SSL_INSECURE')?.toLowerCase() !== 'true',
      key: sslKey,
      cert: sslCert,
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
          url: `ldap://${configService.get('LDAP_HOST')}:${
            configService.get('LDAP_PORT') || 389
          }`,
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
              ca: sslConfig.ca,
              cert: sslConfig.cert,
              key: sslConfig.key
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
