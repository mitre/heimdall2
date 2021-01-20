import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {GroupUser} from './group-user.model';

@Module({
  imports: [SequelizeModule.forFeature([GroupUser])],
})
export class GroupUsersModule { }
