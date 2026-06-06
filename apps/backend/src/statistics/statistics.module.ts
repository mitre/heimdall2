import {Module} from '@nestjs/common';
import {ApiKeyService} from '../apikeys/apikey.service';
import {EvaluationTagsService} from '../evaluation-tags/evaluation-tags.service';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {GroupsService} from '../groups/groups.service';
import {UsersService} from '../users/users.service';
import {StatisticsController} from './statistics.controller';
import {StatisticsService} from './statistics.service';

@Module({
  providers: [
    StatisticsService,
    ApiKeyService,
    EvaluationsService,
    EvaluationTagsService,
    UsersService,
    GroupsService,
  ],
  controllers: [StatisticsController],
})
export class StatisticsModule {}
