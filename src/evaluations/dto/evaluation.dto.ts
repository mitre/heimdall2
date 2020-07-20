import { Evaluation } from '../evaluation.model';

export class EvaluationDto {
  id: number;
  readonly version: string
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(evaluation: Evaluation) {
    this.id = evaluation.id;
    this.version = evaluation.version;
    this.createdAt = evaluation.createdAt;
    this.updatedAt = evaluation.updatedAt;
  }
}
