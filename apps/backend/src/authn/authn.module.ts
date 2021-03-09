import {Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {SequelizeModule} from '@nestjs/sequelize';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {EvaluationTagsService} from '../evaluation-tags/evaluation-tags.service';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {Statistics} from '../statistics/statistics.model';
import {StatisticsModule} from '../statistics/statistics.module';
import {StatisticsService} from '../statistics/statistics.service';
import {TokenModule} from '../token/token.module';
import {UsersModule} from '../users/users.module';
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
    SequelizeModule.forFeature([Statistics, EvaluationTag, Group]),
    UsersModule,
    PassportModule,
    TokenModule,
    ConfigModule,
    StatisticsModule,
    ConfigModule
  ],
  providers: [
    AuthnService,
    ConfigService,
    LocalStrategy,
    JwtStrategy,
    GithubStrategy,
    GitlabStrategy,
    GoogleStrategy,
    OktaStrategy,
    OidcStrategy,
    LDAPStrategy,
    EvaluationTagsService,
    StatisticsService,
    GroupsService
  ],
  controllers: [AuthnController]
})
export class AuthnModule {}
