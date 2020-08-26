import {EvaluationTag} from '../evaluation-tag.model';

export class EvaluationTagDto {
  readonly id: number;
  readonly key: string;
  readonly value: string;
  readonly evaluationId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(evaluationTag: EvaluationTag) {
    this.id = evaluationTag.id;
    this.key = evaluationTag.key;
    this.value = evaluationTag.value;
    this.evaluationId = evaluationTag.evaluationId;
    this.createdAt = evaluationTag.createdAt;
    this.updatedAt = evaluationTag.updatedAt;
  }
}
