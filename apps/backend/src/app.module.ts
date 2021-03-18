import {Module} from '@nestjs/common';
import {APP_FILTER} from '@nestjs/core';
import {ServeStaticModule} from '@nestjs/serve-static';
import {join} from 'path';
import {AppController} from './app.controller';
import {AuthnModule} from './authn/authn.module';
import {AuthzModule} from './authz/authz.module';
import {CaslExceptionFilter} from './casl/casl-exception.filter';
import {ConfigModule} from './config/config.module';
import {DatabaseModule} from './database/database.module';
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
      rootPath: join(__dirname, '..', '..', 'frontend')
    }),
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
    StatisticsModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: CaslExceptionFilter
    }
  ]
})
export class AppModule {}
