import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {User} from '../users/user.model';

@Table
export class Evaluation extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: string;

  @AllowNull(false)
  @Column
  filename!: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  data!: Record<string, unknown>;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @CreatedAt
  @AllowNull(false)
  @Column
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column
  updatedAt!: Date;

  @HasMany(() => EvaluationTag)
  evaluationTags!: EvaluationTag[];
}
