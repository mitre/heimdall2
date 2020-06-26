<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
=======
import { Module } from "@nestjs/common";
import { EvaluationsService } from "./evaluations.service";
>>>>>>> 1e60cf181be85c19cb3db147ff6aef31fa3851e9


@Module({
  providers: [EvaluationsService],
  exports: [EvaluationsService]
})
export class EvaluationsModule {}
