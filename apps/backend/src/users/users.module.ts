import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {AuthzModule} from '../authz/authz.module';
import {ConfigModule} from '../config/config.module';
import {LoggingModule} from '../logging/logging.module';
import {LoggingService} from '../logging/logging.service';
import {User} from './user.model';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    AuthzModule,
    ConfigModule,
    LoggingModule
  ],
  providers: [UsersService, LoggingService],
  controllers: [UsersController],
  exports: [SequelizeModule, UsersService]
})
export class UsersModule {}
