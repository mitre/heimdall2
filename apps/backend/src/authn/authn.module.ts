import {Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {ApiKeyService} from '../apikeys/apikey.service';
import {ApiKeyModule} from '../apikeys/apikeys.module';
import {ConfigModule} from '../config/config.module';
import {TokenModule} from '../token/token.module';
import {UsersModule} from '../users/users.module';
import {APIKeyStrategy} from './apikey.strategy';
import {AuthnController} from './authn.controller';
import {AuthnService} from './authn.service';
import {GithubStrategy} from './github.strategy';
import {GitlabStrategy} from './gitlab.strategy';
import {GoogleStrategy} from './google.strategy';
import {JwtStrategy} from './jwt.strategy';
import {LDAPStrategy} from './ldap.strategy';
import {LocalStrategy} from './local.strategy';
import {OidcStrategy} from './oidc.strategy';
import {OktaStrategy} from './okta.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TokenModule,
    ConfigModule,
    ApiKeyModule
  ],
  providers: [
    AuthnService,
    APIKeyStrategy,
    LocalStrategy,
    JwtStrategy,
    GithubStrategy,
    GitlabStrategy,
    GoogleStrategy,
    OktaStrategy,
    OidcStrategy,
    LDAPStrategy,
    ApiKeyService
  ],
  controllers: [AuthnController]
})
export class AuthnModule {}
