import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
import {Evaluation} from '../evaluations/evaluation.model';

@Table
export class EvaluationTag extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: string;

  @AllowNull(false)
  @Column
  value!: string;

  @AllowNull(false)
  @Column
  createdAt!: Date;

  @AllowNull(false)
  @Column
  updatedAt!: Date;

  @ForeignKey(() => Evaluation)
  @Column(DataType.BIGINT)
  evaluationId!: string;

  @BelongsTo(() => Evaluation)
  evaluation!: Evaluation;
}
