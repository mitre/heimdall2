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
  @CreatedAt
  @AllowNull(false)
  @Column
  declare createdAt: Date;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare data: Record<string, unknown>;

  @HasMany(() => EvaluationTag)
  declare evaluationTags: EvaluationTag[];

  @AllowNull(false)
  @Column
  declare filename: string;

  @ForeignKey(() => Group)
  @Column(DataType.BIGINT)
  declare groupId: string;

  @BelongsToMany(() => Group, () => GroupEvaluation)
  declare groups: (Group & { GroupEvaluation: GroupEvaluation })[];

  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare public: boolean;

  @UpdatedAt
  @AllowNull(false)
  @Column
  declare updatedAt: Date;

  @BelongsTo(() => User, { constraints: false })
  declare user: User;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  declare userId: string;
}
