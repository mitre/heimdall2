import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {GroupEvaluation} from './group-evaluation.model';

@Module({
  imports: [SequelizeModule.forFeature([GroupEvaluation])],
})
export class GroupEvaluationsModule { }
