import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Request} from 'express';
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
      async (req: Request, user: any, done: any) => {
        const {firstName, lastName} = this.authnService.splitName(
          user[configService.get('LDAP_NAMEFIELD') || 'name']
        );
        const email: string =
          user[configService.get('LDAP_MAILFIELD') || 'mail'];

        req.user = this.authnService.validateOrCreateUser(
          email,
          firstName,
          lastName
        );
        return done(null, req.user);
      }
    );
  }
}
