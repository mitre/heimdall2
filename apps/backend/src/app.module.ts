import {Module} from '@nestjs/common';
import {APP_FILTER} from '@nestjs/core';
import {ServeStaticModule} from '@nestjs/serve-static';
import {join} from 'path';
import {ApiKeyModule} from './apikeys/apikeys.module';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {AuthnModule} from './authn/authn.module';
import {AuthzModule} from './authz/authz.module';
import {CaslExceptionFilter} from './casl/casl-exception.filter';
import {ConfigModule} from './config/config.module';
import {DatabaseModule} from './database/database.module';
import {EchoModule} from './echo/echo.module';
import {EvaluationTagsModule} from './evaluation-tags/evaluation-tags.module';
import {EvaluationsModule} from './evaluations/evaluations.module';
import {GroupEvaluationsModule} from './group-evaluations/group-evaluations.module';
import {GroupUsersModule} from './group-users/group-users.module';
import {GroupsModule} from './groups/groups.module';
import {StatisticsModule} from './statistics/statistics.module';
import {UsersModule} from './users/users.module';

@Module({
  controllers: [AppController],
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', '..', 'dist', 'frontend')
    }),
    ApiKeyModule,
    UsersModule,
    DatabaseModule,
    ConfigModule,
    AuthzModule,
    AuthnModule,
    EvaluationTagsModule,
    EvaluationsModule,
    GroupEvaluationsModule,
    GroupsModule,
    GroupUsersModule,
    StatisticsModule,
    EchoModule
  ],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: CaslExceptionFilter
    }
  ]
})
export class AppModule {}
