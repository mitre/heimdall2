import {forwardRef, Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {ConfigModule} from '../config/config.module';
import {DatabaseModule} from '../database/database.module';
import {EvaluationsModule} from '../evaluations/evaluations.module';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {Build} from './build.model';
import {BuildsController} from './builds.controller';
import {BuildsService} from './builds.service';
import {UsersModule} from '../users/users.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Build,
      Group,
    ]),
    ConfigModule,
    EvaluationsModule,
    forwardRef(() => UsersModule),
    DatabaseModule
  ],
  providers: [BuildsService, GroupsService],
  controllers: [BuildsController],
  exports: [BuildsService]
})
export class BuildsModule {}
