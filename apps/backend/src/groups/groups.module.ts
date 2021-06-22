import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {AuthzModule} from '../authz/authz.module';
import {EvaluationTagsModule} from '../evaluation-tags/evaluation-tags.module';
import {EvaluationsModule} from '../evaluations/evaluations.module';
import {LoggingModule} from '../logging/logging.module';
import {LoggingService} from '../logging/logging.service';
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
    EvaluationTagsModule,
    LoggingModule
  ],
  providers: [GroupsService, LoggingService],
  controllers: [GroupsController],
  exports: [GroupsService]
})
export class GroupsModule {}
