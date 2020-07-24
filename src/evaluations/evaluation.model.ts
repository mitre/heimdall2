import {
  Model,
  Column,
  Table,
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  AllowNull,
  DataType,
  AutoIncrement,
  HasMany
} from 'sequelize-typescript';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';

@Table
export class Evaluation extends Model<Evaluation> {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id: number;

  @AllowNull(false)
  @Column
  version: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  data: Record<string, any>;

  @CreatedAt
  @AllowNull(false)
  @Column
  createdAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column
  updatedAt: Date;

  @HasMany(() => EvaluationTag)
  evaluationTags: EvaluationTag[]
}
