import {IEvaluation} from '@heimdall/interfaces';
import {EvaluationTagDto} from '../../evaluation-tags/dto/evaluation-tag.dto';
import {GroupDto} from '../../groups/dto/group.dto';
import {Evaluation} from '../evaluation.model';

export class EvaluationDto implements IEvaluation {
  readonly id: string;
  filename: string;
  readonly data?: Record<string, unknown>;
  readonly evaluationTags: EvaluationTagDto[];
  readonly groups?: GroupDto[];
  readonly userId: string;
  readonly public: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly editable: boolean;
  readonly shareURL?: string;

  constructor(
    evaluation: Evaluation,
    editable = false,
    shareURL: string | undefined = undefined
  ) {
    this.id = evaluation.id;
    this.filename = evaluation.filename;
    this.data = evaluation.data;
    if (
      evaluation.evaluationTags === null ||
      evaluation.evaluationTags === undefined
    ) {
      this.evaluationTags = [];
    } else {
      this.evaluationTags = evaluation.evaluationTags.map(
        (tag) => new EvaluationTagDto(tag)
      );
    }
    if (evaluation.groups === undefined) {
      this.groups = [];
    } else {
      this.groups = evaluation.groups.map((group) => new GroupDto(group));
    }
    this.userId = evaluation.userId;
    this.public = evaluation.public;
    this.createdAt = evaluation.createdAt;
    this.updatedAt = evaluation.updatedAt;
    this.editable = editable;
    this.shareURL = shareURL;
  }
}
