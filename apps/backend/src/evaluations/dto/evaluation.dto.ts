import {Evaluation} from '../evaluation.model';
import {EvaluationTagDto} from '../../evaluation-tags/dto/evaluation-tag.dto';
import {IEvaluation} from '@heimdall/interfaces';

export class EvaluationDto implements IEvaluation {
  readonly id: number;
  readonly filename: string;
  readonly data: Record<string, any> | undefined;
  readonly evaluationTags: EvaluationTagDto[] | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(evaluation: Evaluation) {
    this.id = evaluation.id;
    this.filename = evaluation.filename;
    this.data = evaluation.data;
    if (
      evaluation.evaluationTags === null ||
      evaluation.evaluationTags === undefined
    ) {
      this.evaluationTags = null;
    } else {
      this.evaluationTags = evaluation.evaluationTags.map(
        (tag) => new EvaluationTagDto(tag)
      );
    }
    this.createdAt = evaluation.createdAt;
    this.updatedAt = evaluation.updatedAt;
  }
}
