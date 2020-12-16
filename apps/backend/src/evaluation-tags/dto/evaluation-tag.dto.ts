import {IEvaluationTag} from '@heimdall/interfaces';
import {EvaluationTag} from '../evaluation-tag.model';

export class EvaluationTagDto implements IEvaluationTag {
  readonly id: number;
  readonly value: string;
  readonly evaluationId: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(evaluationTag: EvaluationTag) {
    this.id = evaluationTag.id;
    this.value = evaluationTag.value;
    this.evaluationId = evaluationTag.evaluationId;
    this.createdAt = evaluationTag.createdAt;
    this.updatedAt = evaluationTag.updatedAt;
  }
}
