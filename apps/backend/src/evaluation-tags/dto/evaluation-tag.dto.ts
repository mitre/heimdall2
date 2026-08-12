import type { IEvaluationTag } from '@heimdall/common/interfaces';
import type { EvaluationTag } from '../evaluation-tag.model';

export class EvaluationTagDto implements IEvaluationTag {
  readonly createdAt: Date;
  readonly evaluationId: string;
  readonly id: string;
  readonly updatedAt: Date;
  readonly value: string;

  constructor(evaluationTag: EvaluationTag) {
    this.id = evaluationTag.id;
    this.value = evaluationTag.value;
    this.evaluationId = evaluationTag.evaluationId;
    this.createdAt = evaluationTag.createdAt;
    this.updatedAt = evaluationTag.updatedAt;
  }
}
