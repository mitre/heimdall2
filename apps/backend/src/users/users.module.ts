import {forwardRef, Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {ApiKeyModule} from '../apikeys/apikeys.module';
import {AuthnModule} from '../authn/authn.module';
import {AuthnService} from '../authn/authn.service';
import {AuthzModule} from '../authz/authz.module';
import {ConfigModule} from '../config/config.module';
import {TokenModule} from '../token/token.module';
import {User} from './user.model';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    forwardRef(() => ApiKeyModule),
    AuthzModule,
    forwardRef(() => AuthnModule),
    ConfigModule,
    TokenModule
  ],
  providers: [AuthnService, UsersService],
  controllers: [UsersController],
  exports: [SequelizeModule, UsersService]
})
export class UsersModule {}
