import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {AuthzModule} from '../authz/authz.module';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {EvaluationTagsModule} from '../evaluation-tags/evaluation-tags.module';
import {EvaluationTagsService} from '../evaluation-tags/evaluation-tags.service';
import {EvaluationsModule} from '../evaluations/evaluations.module';
import {UsersModule} from '../users/users.module';
import {Group} from './group.model';
import {GroupsController} from './groups.controller';
import {GroupsService} from './groups.service';

@Module({
  imports: [
    SequelizeModule.forFeature([EvaluationTag, Group]),
    AuthzModule,
    UsersModule,
    EvaluationsModule,
    EvaluationTagsModule
  ],
  providers: [GroupsService, EvaluationTagsService],
  controllers: [GroupsController],
  exports: [GroupsService]
})
export class GroupsModule {}
