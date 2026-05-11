import type { Agent } from 'http';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyService } from '../apikeys/apikey.service';
import { ApiKeyModule } from '../apikeys/apikeys.module';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { GroupsModule } from '../groups/groups.module';
import { GroupsService } from '../groups/groups.service';
import { TokenModule } from '../token/token.module';
import { UsersModule } from '../users/users.module';
import { APIKeyStrategy } from './apikey.strategy';
import { AuthnController } from './authn.controller';
import { AuthnService } from './authn.service';
import { GithubStrategy } from './github.strategy';
import { GitlabStrategy } from './gitlab.strategy';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';
import { LDAPStrategy } from './ldap.strategy';
import { LocalStrategy } from './local.strategy';
import { OidcStrategy } from './oidc.strategy';
import { OktaStrategy } from './okta.strategy';
import { SAMLStrategy } from './saml.strategy';

async function buildHttpsProxyAgent(proxyUrl: string): Promise<Agent> {
  const { HttpsProxyAgent } = await import('https-proxy-agent');
  return new HttpsProxyAgent(proxyUrl);
}

@Module({
  controllers: [AuthnController],
  imports: [
    ApiKeyModule,
    UsersModule,
    PassportModule,
    TokenModule,
    ConfigModule,
    GroupsModule,
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
    SAMLStrategy,
    {
      inject: [AuthnService, ConfigService, GroupsService],
      provide: OidcStrategy,
      useFactory: async (
        authn: AuthnService,
        config: ConfigService,
        groups: GroupsService,
      ) =>
        new OidcStrategy(
          authn,
          config,
          groups,
          config.get('OIDC_USE_HTTPS_PROXY') === 'true'
            ? await buildHttpsProxyAgent(config.get('HTTPS_PROXY') ?? '')
            : undefined,
        ),
    },
    {
      inject: [AuthnService, ConfigService],
      provide: OktaStrategy,
      useFactory: async (authn: AuthnService, config: ConfigService) =>
        new OktaStrategy(
          authn,
          config,
          config.get('OKTA_USE_HTTPS_PROXY') === 'true'
            ? await buildHttpsProxyAgent(config.get('HTTPS_PROXY') ?? '')
            : undefined,
        ),
    },
  ],
})
export class AuthnModule {}
