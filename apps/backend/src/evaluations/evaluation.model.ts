import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';

@Table
export class Evaluation extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column
  filename!: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  data!: Record<string, unknown>;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  public!: boolean;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  userId!: string;

  @ForeignKey(() => Group)
  @Column(DataType.BIGINT)
  groupId!: string;

  @BelongsTo(() => User, {
    constraints: false
  })
  user!: User;

  @CreatedAt
  @AllowNull(false)
  @Column
  declare createdAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column
  declare updatedAt: Date;

  @HasMany(() => EvaluationTag)
  evaluationTags!: EvaluationTag[];

  @BelongsToMany(() => Group, () => GroupEvaluation)
  groups!: Array<Group & {GroupEvaluation: GroupEvaluation}>;
}
