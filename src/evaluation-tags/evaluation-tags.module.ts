import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {EvaluationTag} from './evaluation-tag.model';
import {EvaluationsModule} from '../evaluations/evaluations.module';

@Module({
  imports: [
    SequelizeModule.forFeature([EvaluationTag]),
    EvaluationsModule
  ],

})
export class EvaluationTagModule {}
