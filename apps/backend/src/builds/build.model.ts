import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import {Evaluation} from '../evaluations/evaluation.model';
import {BuildEvaluation} from '../build-evaluations/build-evaluations.model';
import {GroupBuild} from '../group-builds/group-build.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';

@Table
export class Build extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: string;

  @AllowNull(false)
  @Column
  buildId!: string;

  @AllowNull(true)
  @Column
  buildType!: number;

  @AllowNull(true)
  @Column
  branchName!: string;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: Date;

  @BelongsToMany(() => Evaluation, () => BuildEvaluation)
  evaluations!: Array<Evaluation & {BuildEvaluation: BuildEvaluation}>;

  @BelongsToMany(() => Group, () => GroupBuild)
  groups!: Array<Group & {GroupBuild: GroupBuild}>;

  @ForeignKey(() => Group)
  @Column(DataType.BIGINT)
  groupId!: string;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  userId!: string;

  @BelongsTo(() => User, {
    constraints: false
  })
  user!: User;
}
