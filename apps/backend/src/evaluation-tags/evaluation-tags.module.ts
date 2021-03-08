import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {DatabaseModule} from '../database/database.module';
import {Evaluation} from '../evaluations/evaluation.model';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {EvaluationTag} from './evaluation-tag.model';
import {EvaluationTagsController} from './evaluation-tags.controller';
import {EvaluationTagsService} from './evaluation-tags.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Evaluation, Group, User, EvaluationTag]),
    DatabaseModule
  ],
  providers: [EvaluationsService, EvaluationTagsService],
  controllers: [EvaluationTagsController],
  exports: [EvaluationTagsService]
})
export class EvaluationTagsModule {}
