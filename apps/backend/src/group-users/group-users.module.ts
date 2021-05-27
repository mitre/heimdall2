import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {AuthzModule} from '../authz/authz.module';
import {UsersModule} from '../users/users.module';
import {GroupUser} from './group-user.model';
import {GroupUsersController} from './group-users.controller';
import {GroupUsersService} from './group-users.service';

@Module({
  imports: [SequelizeModule.forFeature([GroupUser]), AuthzModule, UsersModule],
  providers: [GroupUsersService],
  controllers: [GroupUsersController],
  exports: [GroupUsersService]
})
export class GroupUsersModule {}
