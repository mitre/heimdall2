import {Evaluation} from '../evaluation.model';
import {EvaluationTagDto} from '../../evaluation-tags/dto/evaluation-tag.dto';
import {IEvaluation} from '@heimdall/interfaces';

export class EvaluationDto implements IEvaluation {
  id: number;
  readonly filename: string;
  readonly data: Record<string, any>;
  readonly evaluationTags: EvaluationTagDto[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(evaluation: Evaluation) {
    this.id = evaluation.id;
    this.filename = evaluation.filename;
    this.data = evaluation.data;
    this.evaluationTags = evaluation.evaluationTags.map(
      tag => new EvaluationTagDto(tag)
    );
    this.createdAt = evaluation.createdAt;
    this.updatedAt = evaluation.updatedAt;
  }
}
