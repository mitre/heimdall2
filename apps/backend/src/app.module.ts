import {Module} from '@nestjs/common';
import {UsersModule} from './users/users.module';
import {DatabaseModule} from './database/database.module';
import {ConfigModule} from './config/config.module';
import {AuthzModule} from './authz/authz.module';
import {AuthnModule} from './authn/authn.module';
import {EvaluationTagsModule} from './evaluation-tags/evaluation-tags.module';
import {EvaluationsModule} from './evaluations/evaluations.module';
import {UpdatesModule} from './updates/updates.module';
import {ServeStaticModule} from '@nestjs/serve-static';
import {join} from 'path';
import {AppController} from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'dist', 'frontend')
    }),
    UsersModule,
    DatabaseModule,
    ConfigModule,
    AuthzModule,
    AuthnModule,
    EvaluationTagsModule,
    EvaluationsModule,
    UpdatesModule
  ]
})
export class AppModule {}
