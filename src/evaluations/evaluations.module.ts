import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Evaluation} from './evaluation.model';
import {EvaluationsService} from './evaluations.service';
import {EvaluationsController} from './evaluations.controller';

@Module({
  imports: [SequelizeModule.forFeature([Evaluation])],
  providers: [EvaluationsService],
  controllers: [EvaluationsController],
  exports: [EvaluationsService]
})
export class EvaluationsModule {}
