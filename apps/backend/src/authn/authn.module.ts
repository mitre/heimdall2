import type {Agent} from 'http';
import {Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {AuthnController} from './authn.controller';
import {ApiKeyModule} from '../apikeys/apikeys.module';
import {ConfigModule} from '../config/config.module';
import {GroupsModule} from '../groups/groups.module';
import {TokenModule} from '../token/token.module';
import {UsersModule} from '../users/users.module';
import {ApiKeyService} from '../apikeys/apikey.service';
import {AuthnService} from './authn.service';
import {ConfigService} from '../config/config.service';
import {GroupsService} from '../groups/groups.service';
import {APIKeyStrategy} from './apikey.strategy';
import {GithubStrategy} from './github.strategy';
import {GitlabStrategy} from './gitlab.strategy';
import {GoogleStrategy} from './google.strategy';
import {JwtStrategy} from './jwt.strategy';
import {LDAPStrategy} from './ldap.strategy';
import {LocalStrategy} from './local.strategy';
import {OidcStrategy} from './oidc.strategy';
import {OktaStrategy} from './okta.strategy';

async function buildHttpsProxyAgent(proxyUrl: string): Promise<Agent> {
  const {HttpsProxyAgent} = await import('https-proxy-agent');
  return new HttpsProxyAgent(proxyUrl);
}

@Module({
  imports: [
    ApiKeyModule,
    UsersModule,
    PassportModule,
    TokenModule,
    ConfigModule,
    GroupsModule
  ],
  providers: [
    AuthnService,
    APIKeyStrategy,
    LocalStrategy,
    JwtStrategy,
    GithubStrategy,
    GitlabStrategy,
    GoogleStrategy,
    LDAPStrategy,
    ApiKeyService,
    {
      provide: OidcStrategy,
      useFactory: async (
        authn: AuthnService,
        config: ConfigService,
        groups: GroupsService
      ) =>
        new OidcStrategy(
          authn,
          config,
          groups,
          config.get('OIDC_USE_HTTPS_PROXY') === 'true'
            ? await buildHttpsProxyAgent(config.get('HTTPS_PROXY') ?? '')
            : undefined
        ),
      inject: [AuthnService, ConfigService, GroupsService]
    },
    {
      provide: OktaStrategy,
      useFactory: async (authn: AuthnService, config: ConfigService) =>
        new OktaStrategy(
          authn,
          config,
          config.get('OKTA_USE_HTTPS_PROXY') === 'true'
            ? await buildHttpsProxyAgent(config.get('HTTPS_PROXY') ?? '')
            : undefined
        ),
      inject: [AuthnService, ConfigService]
    }
  ],
  controllers: [AuthnController]
})
export class AuthnModule {}
