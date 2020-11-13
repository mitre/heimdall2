import {Module} from '@nestjs/common';
import {ServeStaticModule} from '@nestjs/serve-static';
import {join} from 'path';
import {AppController} from './app.controller';
import {AuthnModule} from './authn/authn.module';
import {AuthzModule} from './authz/authz.module';
import {ConfigModule} from './config/config.module';
import {DatabaseModule} from './database/database.module';
import {EvaluationTagsModule} from './evaluation-tags/evaluation-tags.module';
import {EvaluationsModule} from './evaluations/evaluations.module';
import {UsersModule} from './users/users.module';

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
    EvaluationsModule
  ]
})
export class AppModule {}
