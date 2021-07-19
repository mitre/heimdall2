import {forwardRef, Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {SequelizeModule} from '@nestjs/sequelize';
import {ApiKeyService} from '../apikeys/apikey.service';
import {ApiKeyModule} from '../apikeys/apikeys.module';
import {ConfigModule} from '../config/config.module';
import {TokenModule} from '../token/token.module';
import {User} from '../users/user.model';
import {UsersModule} from '../users/users.module';
import {UsersService} from '../users/users.service';
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
    SequelizeModule.forFeature([User]),
    forwardRef(() => ApiKeyModule),
    ConfigModule,
    UsersModule,
    PassportModule,
    TokenModule,
    UsersModule
  ],
  providers: [
    AuthnService,
    APIKeyStrategy,
    ApiKeyService,
    LocalStrategy,
    JwtStrategy,
    GithubStrategy,
    GitlabStrategy,
    GoogleStrategy,
    LDAPStrategy,
    OktaStrategy,
    OidcStrategy,
    UsersService
  ],
  controllers: [AuthnController]
})
export class AuthnModule {}
