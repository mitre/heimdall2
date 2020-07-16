import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {EvaluationTag} from './evaluation-tag.model';
import {EvaluationsModule} from '../evaluations/evaluations.module';
import {EvaluationTagsController} from './evaluation-tags.controller';
import {EvaluationTagsService} from './evaluation-tags.service';

@Module({
  imports: [
    SequelizeModule.forFeature([EvaluationTag]),
    EvaluationsModule
  ],
  providers: [EvaluationTagsService],
  controllers: [EvaluationTagsController]
})
export class EvaluationTagModule {}
