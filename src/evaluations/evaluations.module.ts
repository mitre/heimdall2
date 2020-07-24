import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Evaluation} from './evaluation.model';
import {EvaluationsService} from './evaluations.service';
import {EvaluationsController} from './evaluations.controller';
import {EvaluationTagsModule} from '../evaluation-tags/evaluation-tags.module';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Evaluation]),
    SequelizeModule.forFeature([EvaluationTag]),
    EvaluationTagsModule
  ],
  providers: [EvaluationsService],
  controllers: [EvaluationsController],
  exports: [EvaluationsService]
})
export class EvaluationsModule {}
