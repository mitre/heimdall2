import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {ApiKey} from '../apikeys/apikey.model';
import {ApiKeyService} from '../apikeys/apikey.service';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';
import {DatabaseService} from '../database/database.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {EvaluationTagsService} from '../evaluation-tags/evaluation-tags.service';
import {Evaluation} from '../evaluations/evaluation.model';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {GroupRelation} from '../group-relations/group-relation.model';
import {GroupRelationsService} from '../group-relations/group-relations.service';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {StatisticsController} from './statistics.controller';
import {StatisticsService} from './statistics.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ApiKey,
      Evaluation,
      EvaluationTag,
      User,
      Group,
      GroupRelation
    ]),
    ConfigModule
  ],
  providers: [
    StatisticsService,
    ApiKeyService,
    ConfigService,
    DatabaseService,
    EvaluationsService,
    EvaluationTagsService,
    UsersService,
    GroupsService,
    GroupRelationsService
  ],
  controllers: [StatisticsController]
})
export class StatisticsModule {}
