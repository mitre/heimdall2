import {forwardRef, Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {GroupsModule} from 'src/groups/groups.module';
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
    forwardRef(() => GroupsModule)
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [SequelizeModule, UsersService]
})
export class UsersModule {}
