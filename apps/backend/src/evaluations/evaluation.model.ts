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
  UpdatedAt,
} from 'sequelize-typescript';
import { EvaluationTag } from '../evaluation-tags/evaluation-tag.model';
import { GroupEvaluation } from '../group-evaluations/group-evaluation.model';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';

@Table
export class Evaluation extends Model {
  @AllowNull(false)
  @Column
  @CreatedAt
  declare createdAt: Date;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare data: Record<string, unknown>;

  @HasMany(() => EvaluationTag)
  declare evaluationTags: EvaluationTag[];

  @AllowNull(false)
  @Column
  declare filename: string;

  @Column(DataType.BIGINT)
  @ForeignKey(() => Group)
  declare groupId: string;

  @BelongsToMany(() => Group, () => GroupEvaluation)
  declare groups: (Group & { GroupEvaluation: GroupEvaluation })[];

  @AllowNull(false)
  @AutoIncrement
  @Column(DataType.BIGINT)
  @PrimaryKey
  declare id: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  @Default(false)
  declare public: boolean;

  @AllowNull(false)
  @Column
  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => User, { constraints: false })
  declare user: User;

  @Column(DataType.BIGINT)
  @ForeignKey(() => User)
  declare userId: string;
}
