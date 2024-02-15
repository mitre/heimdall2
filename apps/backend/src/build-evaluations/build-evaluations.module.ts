import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {BuildEvaluation} from './build-evaluations.model';

@Module({
  imports: [SequelizeModule.forFeature([BuildEvaluation])]
})
export class BuildEvaluationsModule {}
