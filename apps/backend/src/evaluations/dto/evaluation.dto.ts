import {EvaluationTagDto} from '../../evaluation-tags/dto/evaluation-tag.dto';
import {GroupDto} from '../../groups/dto/group.dto';

interface EvaluationWithRelations {
  id: number;
  filename: string;
  data?: unknown;
  public: boolean;
  userId?: number | null;
  groupId?: number | null;
  createdAt: string;
  updatedAt: string;
  evaluationTags?: Array<{id: number; value: string | null; evaluationId: number | null; createdAt: string; updatedAt: string}>;
  user?: {id: number; email: string} | null;
  groupEvaluations?: Array<{
    group: {
      id: number; name: string; public: boolean; desc: string | null;
      createdAt: string; updatedAt: string;
      groupUsers: Array<{role: string | null; user: {id: number; email: string; title?: string | null; firstName?: string | null; lastName?: string | null} | null}>;
    } | null;
  }>;
}

export class EvaluationDto {
  readonly id: string;
  filename: string;
  readonly data?: unknown;
  readonly evaluationTags: EvaluationTagDto[];
  readonly groups: GroupDto[];
  readonly userId?: string;
  readonly groupId?: string;
  readonly public: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly editable: boolean;
  readonly shareURL?: string;

  constructor(
    evaluation: EvaluationWithRelations,
    editable = false,
    shareURL?: string,
  ) {
    this.id = String(evaluation.id);
    this.filename = evaluation.filename;
    this.data = evaluation.data;
    this.evaluationTags = (evaluation.evaluationTags ?? []).map(
      (tag) => new EvaluationTagDto(tag),
    );
    this.groups = (evaluation.groupEvaluations ?? [])
      .filter((ge): ge is typeof ge & {group: NonNullable<typeof ge.group>} => ge.group != null)
      .map((ge) => new GroupDto(ge.group));
    this.userId = evaluation.userId != null ? String(evaluation.userId) : undefined;
    this.groupId = evaluation.groupId != null ? String(evaluation.groupId) : undefined;
    this.public = evaluation.public;
    this.createdAt = new Date(evaluation.createdAt);
    this.updatedAt = new Date(evaluation.updatedAt);
    this.editable = editable;
    this.shareURL = shareURL;
  }
}

export interface IEvaluationResponse {
  evaluations: EvaluationDto[];
  totalCount: number;
  meta?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}
