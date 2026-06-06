import {Module} from '@nestjs/common';
import {APP_FILTER, APP_PIPE} from '@nestjs/core';
import {ZodValidationPipe} from 'nestjs-zod';
import {ServeStaticModule} from '@nestjs/serve-static';
import {AuthModule} from '@thallesp/nestjs-better-auth';
import {join} from 'path';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';
import {ApiKeyModule} from './apikeys/apikeys.module';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {createAuth} from './auth/auth.config';
import {BootstrapService} from './auth/bootstrap.service';
import {AuthnModule} from './authn/authn.module';
import {AuthzModule} from './authz/authz.module';
import {CaslExceptionFilter} from './casl/casl-exception.filter';
import {ConfigModule} from './config/config.module';
import {DRIZZLE, DrizzleModule} from './db/drizzle.module';
import {EvaluationTagsModule} from './evaluation-tags/evaluation-tags.module';
import {EvaluationsModule} from './evaluations/evaluations.module';
import env from './env';
import {GroupsModule} from './groups/groups.module';
import {StatisticsModule} from './statistics/statistics.module';
import {UsersModule} from './users/users.module';
import {TenableModule} from './tenable/tenable.module';

@Module({
  controllers: [AppController],
  imports: [
    AuthModule.forRoot({auth: createAuth({}), disableGlobalAuthGuard: false}),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'dist', 'frontend'),
      renderPath: '*splat',
      exclude: ['/api{/*path}', '/authn{/*path}', '/server', '/evaluations{/*path}', '/groups{/*path}', '/users{/*path}', '/apikeys{/*path}', '/evaluation-tags{/*path}', '/statistics{/*path}'],
    }),
    ConfigModule,
    ApiKeyModule,
    UsersModule,
    DrizzleModule,
    AuthzModule,
    AuthnModule,
    EvaluationTagsModule,
    EvaluationsModule,
    GroupsModule,
    StatisticsModule,
    TenableModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: CaslExceptionFilter,
    },
    {
      provide: BootstrapService,
      useFactory: (db: NodePgDatabase<Record<string, unknown>>) =>
        new BootstrapService(db, {
          adminEmail: env.ADMIN_EMAIL,
          adminPassword: env.ADMIN_PASSWORD,
        }),
      inject: [DRIZZLE],
    },
  ],
})
export class AppModule {}
