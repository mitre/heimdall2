import {Module} from '@nestjs/common';
import {AuthnService} from '../authn/authn.service';
import {AuthzModule} from '../authz/authz.module';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';
import {GroupsService} from '../groups/groups.service';
import {TokenModule} from '../token/token.module';
import {UsersService} from '../users/users.service';
import {ApiKeyController} from './apikey.controller';
import {ApiKeyService} from './apikey.service';

@Module({
  imports: [
    AuthzModule,
    ConfigModule,
    TokenModule,
  ],
  providers: [
    ConfigService,
    AuthnService,
    UsersService,
    GroupsService,
    ApiKeyService,
  ],
  exports: [ApiKeyService],
  controllers: [ApiKeyController],
})
export class ApiKeyModule {}
