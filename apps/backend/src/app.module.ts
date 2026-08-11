import path from 'node:path';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AdminModule } from './admin/admin.module';
import { ApiKeyModule } from './apikeys/apikeys.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthnModule } from './authn/authn.module';
import { AuthzModule } from './authz/authz.module';
import { CaslExceptionFilter } from './casl/casl-exception.filter';
import { ConfigModule } from './config/config.module';
import { CryptoModule } from './crypto/crypto.module';
import { DatabaseModule } from './database/database.module';
import { EvaluationTagsModule } from './evaluation-tags/evaluation-tags.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { GroupEvaluationsModule } from './group-evaluations/group-evaluations.module';
import { GroupUsersModule } from './group-users/group-users.module';
import { GroupsModule } from './groups/groups.module';
import { HealthModule } from './health/health.module';
import { StatisticsModule } from './statistics/statistics.module';
import { TenableModule } from './tenable/tenable.module';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [AppController],
  imports: [
    ServeStaticModule.forRoot({
      renderPath: '*splat',
      // eslint's prefer-module wants import.meta here, but this package
      // compiles to CommonJS (nodenext, no "type": "module") where
      // import.meta is a syntax error — resolving the frontend bundle stays
      // on __dirname until an ESM migration.
      rootPath: path.join(__dirname, '..', '..', '..', '..', 'dist', 'frontend'),
    }),
    ConfigModule,
    CryptoModule,
    AdminModule,
    ApiKeyModule,
    UsersModule,
    DatabaseModule,
    AuthzModule,
    AuthnModule,
    EvaluationTagsModule,
    EvaluationsModule,
    GroupEvaluationsModule,
    GroupsModule,
    GroupUsersModule,
    HealthModule,
    StatisticsModule,
    TenableModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: CaslExceptionFilter,
    },
  ],
})
export class AppModule {}
