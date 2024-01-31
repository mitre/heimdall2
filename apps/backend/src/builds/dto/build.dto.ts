import {IBuild} from '@heimdall/interfaces';
import {EvaluationDto} from '../../evaluations/dto/evaluation.dto';
import {Build} from '../build.model';
import {GroupDto} from '../../groups/dto/group.dto';
import {Group} from '../../groups/group.model';

export class BuildDto implements IBuild {
  readonly id: string;

  readonly groups: GroupDto[];
  readonly userId?: string;
  readonly groupId?: string;
  readonly buildId: string;
  readonly buildType: number;
  readonly branchName: string;
  readonly evaluations: EvaluationDto[];
  readonly createdAt: Date;
  readonly updatedAt: Date;


  constructor(
    build: Build,
    editable = false,
    shareURL: string | undefined = undefined
  ) {
    this.id = build.id;
    this.buildId = build.buildId;
    this.buildType = build.buildType;
    this.branchName = build.branchName;
    this.evaluations =
    build.evaluations === undefined
      ? []
      : build.evaluations.map((evaluation) => {
          return new EvaluationDto(evaluation, false);
        });
    if (build.groups === null || build.groups === undefined) {
      this.groups = [];
    } else {
      this.groups = build.groups.map(
        (group) => new GroupDto(group as Group)
      );
    }
    this.userId = build.userId;
    this.groupId = build.groupId;
    this.createdAt = build.createdAt;
    this.updatedAt = build.updatedAt;
  }
}
