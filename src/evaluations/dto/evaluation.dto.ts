import { Evaluation } from '../evaluation.model';

export class EvaluationDto {
  id: number;
  readonly version: string;
  readonly data: Object;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(evaluation: Evaluation) {
    this.id = evaluation.id;
    this.version = evaluation.version;
    this.data = evaluation.data;
    this.createdAt = evaluation.createdAt;
    this.updatedAt = evaluation.updatedAt;
  }
}
