import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {ApiKeyService} from '../apikeys/apikey.service';
import {ApiKeyModule} from '../apikeys/apikeys.module';
import {AuthzModule} from '../authz/authz.module';
import {ConfigModule} from '../config/config.module';
import {User} from './user.model';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    AuthzModule,
    ConfigModule,
    ApiKeyModule
  ],
  providers: [UsersService, ApiKeyService],
  controllers: [UsersController],
  exports: [SequelizeModule, UsersService]
})
export class UsersModule {}
