import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {AuthzModule} from '../authz/authz.module';
import {EvaluationTagsModule} from '../evaluation-tags/evaluation-tags.module';
import {EvaluationsModule} from '../evaluations/evaluations.module';
import {UsersModule} from '../users/users.module';
import {Group} from './group.model';
import {GroupsController} from './groups.controller';
import {GroupsService} from './groups.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Group]),
    AuthzModule,
    UsersModule,
    EvaluationsModule,
    EvaluationTagsModule
  ],
  providers: [GroupsService],
  controllers: [GroupsController],
  exports: [GroupsService]
})
export class GroupsModule {}
