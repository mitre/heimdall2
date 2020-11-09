import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {DatabaseModule} from '../database/database.module';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {EvaluationTagsModule} from '../evaluation-tags/evaluation-tags.module';
import {Evaluation} from './evaluation.model';
import {EvaluationsController} from './evaluations.controller';
import {EvaluationsService} from './evaluations.service';
@Module({
  imports: [
    SequelizeModule.forFeature([Evaluation]),
    SequelizeModule.forFeature([EvaluationTag]),
    EvaluationTagsModule,
    DatabaseModule
  ],
  providers: [EvaluationsService],
  controllers: [EvaluationsController],
  exports: [EvaluationsService]
})
export class EvaluationsModule {}
