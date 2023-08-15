import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {ConfigModule} from '../config/config.module';
import {Group} from '../groups/group.model';
import {GroupsModule} from '../groups/groups.module';
import {GroupsService} from '../groups/groups.service';
import {User} from '../users/user.model';
import {UsersModule} from '../users/users.module';
import {GroupRelation} from './group-relation.model';
import {GroupRelationsController} from './group-relations-controller';
import {GroupRelationsService} from './group-relations.service';

@Module({
  imports: [
    SequelizeModule.forFeature([GroupRelation, Group, User]),
    ConfigModule,
    GroupsModule,
    UsersModule
  ],
  providers: [GroupRelationsService, GroupsService],
  controllers: [GroupRelationsController],
  exports: [GroupRelationsService]
})
export class GroupRelationsModule {}
