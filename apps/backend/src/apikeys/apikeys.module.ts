import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {AuthnModule} from '../authn/authn.module';
import {AuthnService} from '../authn/authn.service';
import {AuthzModule} from '../authz/authz.module';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';
import {TokenModule} from '../token/token.module';
import {User} from '../users/user.model';
import {UsersModule} from '../users/users.module';
import {UsersService} from '../users/users.service';
import {ApiKeyController} from './apikey.controller';
import {ApiKey} from './apikey.model';
import {ApiKeyService} from './apikey.service';

@Module({
  imports: [
    SequelizeModule.forFeature([ApiKey, User]),
    AuthnModule,
    AuthzModule,
    ConfigModule,
    ApiKeyModule,
    TokenModule,
    UsersModule
  ],
  providers: [ApiKeyService, AuthnService, ConfigService, UsersService],
  exports: [SequelizeModule, ApiKeyService, UsersService],
  controllers: [ApiKeyController]
})
export class ApiKeyModule {}
