import {Module} from '@nestjs/common';
import {UsersModule} from './users/users.module';
import {DatabaseModule} from './database/database.module';
import {ConfigModule} from './config/config.module';
import {AuthzModule} from './authz/authz.module';
import {AuthnModule} from './authn/authn.module';
import {EvaluationTagModule} from './evaluation-tags/evaluation-tags.module';
import {EvaluationsModule} from './evaluations/evaluations.module';
import {ServeStaticModule} from '@nestjs/serve-static';
import {join} from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client', 'dist'),
    }),
    UsersModule, DatabaseModule, ConfigModule, AuthzModule, AuthnModule, EvaluationTagModule, EvaluationsModule
  ]
})
export class AppModule {}
