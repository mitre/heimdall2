import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Evaluation } from './evaluation.model';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation)
    private evaluationModel: typeof Evaluation
  ) {}

}
