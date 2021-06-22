import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {DatabaseService} from '../database/database.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {EvaluationTagsService} from '../evaluation-tags/evaluation-tags.service';
import {Evaluation} from '../evaluations/evaluation.model';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {LoggingModule} from '../logging/logging.module';
import {LoggingService} from '../logging/logging.service';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {StatisticsController} from './statistics.controller';
import {StatisticsService} from './statistics.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Evaluation, EvaluationTag, User, Group]),
    LoggingModule
  ],
  providers: [
    StatisticsService,
    DatabaseService,
    EvaluationsService,
    EvaluationTagsService,
    UsersService,
    GroupsService,
    LoggingService
  ],
  controllers: [StatisticsController]
})
export class StatisticsModule {}
