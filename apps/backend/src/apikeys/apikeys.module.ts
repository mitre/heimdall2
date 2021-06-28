import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {AuthzModule} from '../authz/authz.module';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {ApiKey} from './apikey.model';

@Module({
  imports: [
    SequelizeModule.forFeature([ApiKey, User]),
    AuthzModule,
    ConfigModule
  ],
  providers: [ConfigService, UsersService],
  exports: [SequelizeModule]
})
export class ApiKeyModule {}
