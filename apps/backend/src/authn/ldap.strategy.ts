import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Request} from 'express';
import _ from 'lodash';
import Strategy from 'passport-ldapauth';
import {ConfigService} from '../config/config.service';
import {AuthnService} from './authn.service';

@Injectable()
export class LDAPStrategy extends PassportStrategy(Strategy, 'ldap') {
  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService
  ) {
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
          passReqToCallback: true
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
