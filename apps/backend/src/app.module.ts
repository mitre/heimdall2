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
import { documentationRoot, frontendRoot } from './config/static-paths';
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

// Matched against `pathname + '/'` by serve-static's exclude check, so this
// covers /docs itself as well as everything beneath it.
const DOCS_SUBTREE = '/docs{/*path}';

@Module({
  controllers: [AppController],
  imports: [
    // ONE forRoot call, docs entry FIRST. The loader iterates this array with
    // forEach, so registration order is array order; two separate forRoot
    // imports would instead depend on undocumented container-insertion order.
    ServeStaticModule.forRoot(
      {
        // Both entries exclude the docs subtree from their RENDER FALLBACK.
        // Only renderFn consults `exclude` — express.static does not — so real
        // files under /docs are still served, while neither fallback answers a
        // docs path that has no file. Without this, an unknown /docs/** path
        // gets 200 plus either the docs home or the SPA shell; the operator
        // needs a real 404.
        exclude: [DOCS_SUBTREE],
        rootPath: documentationRoot(),
        serveRoot: '/docs',
        // VitePress pre-renders every route to a real .html, so no history
        // fallback is wanted; `extensions` gives clean URLs without one.
        serveStaticOptions: { extensions: ['html'], index: 'index.html' },
      },
      {
        exclude: [DOCS_SUBTREE],
        renderPath: '*splat',
        rootPath: frontendRoot(),
      },
    ),
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
