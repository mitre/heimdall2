import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {EvaluationsService} from './evaluations.service';
import {Evaluation} from './evaluation.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Evaluation])
  ],
  providers: [EvaluationsService],
  exports: [EvaluationsService]
})
export class EvaluationsModule {}
