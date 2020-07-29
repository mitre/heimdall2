import {Evaluation} from '../evaluation.model';
import {EvaluationTagDto} from '../../evaluation-tags/dto/evaluation-tag.dto';

export class EvaluationDto {
  id: number;
  readonly version: string;
  readonly data: Record<string, any>;
  readonly evaluationTags: EvaluationTagDto[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(evaluation: Evaluation) {
    this.id = evaluation.id;
    this.version = evaluation.version;
    this.data = evaluation.data;
    this.evaluationTags = evaluation.evaluationTags;
    this.createdAt = evaluation.createdAt;
    this.updatedAt = evaluation.updatedAt;
  }
}
