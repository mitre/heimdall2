import type { IEvaluation } from '@heimdall/common/interfaces';
import { EvaluationTagDto } from '../../evaluation-tags/dto/evaluation-tag.dto';
import { GroupDto } from '../../groups/dto/group.dto';
import type { Group } from '../../groups/group.model';
import type { Evaluation } from '../evaluation.model';

export type IEvaluationResponse = {
  evaluations: EvaluationDto[];
  totalCount: number;
};

export class EvaluationDto implements IEvaluation {
  readonly createdAt: Date;
  readonly data?: Record<string, unknown>;
  readonly editable: boolean;
  readonly evaluationTags: EvaluationTagDto[];
  filename: string;
  readonly groupId?: string;
  readonly groups: GroupDto[];
  readonly id: string;
  readonly public: boolean;
  readonly shareURL?: string;
  readonly updatedAt: Date;
  readonly userId?: string;

  constructor(
    evaluation: Evaluation,
    editable = false,
    shareURL?: string,
  ) {
    this.id = evaluation.id;
    this.filename = evaluation.filename;
    this.data = evaluation.data;
    this.evaluationTags = evaluation.evaluationTags === null
      || evaluation.evaluationTags === undefined
      ? []
      : evaluation.evaluationTags.map(
        tag => new EvaluationTagDto(tag),
      );
    this.groups = evaluation.groups === null || evaluation.groups === undefined
      ? []
      : evaluation.groups.map(
        group => new GroupDto(group as Group),
      );
    this.userId = evaluation.userId;
    this.groupId = evaluation.groupId;
    this.public = evaluation.public;
    this.createdAt = evaluation.createdAt;
    this.updatedAt = evaluation.updatedAt;
    this.editable = editable;
    this.shareURL = shareURL;
  }
}
