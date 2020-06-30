import { Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';

@Module({
  providers: [EvaluationsService],
  exports: [EvaluationsService]
})
export class EvaluationsModule {}
