import {IEvaluation} from '@heimdall/interfaces';
import {EvaluationTagDto} from '../../evaluation-tags/dto/evaluation-tag.dto';
import {Evaluation} from '../evaluation.model';

export class EvaluationDto implements IEvaluation {
  readonly id: number;
  filename: string;
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
