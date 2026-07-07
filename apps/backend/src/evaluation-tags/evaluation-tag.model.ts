import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Evaluation } from '../evaluations/evaluation.model';

@Table
export class EvaluationTag extends Model {
  @AllowNull(false)
  @Column
  declare createdAt: Date;

  @BelongsTo(() => Evaluation)
  declare evaluation: Evaluation;

  @Column(DataType.BIGINT)
  @ForeignKey(() => Evaluation)
  declare evaluationId: string;

  @AllowNull(false)
  @AutoIncrement
  @Column(DataType.BIGINT)
  @PrimaryKey
  declare id: string;

  @AllowNull(false)
  @Column
  declare updatedAt: Date;

  @AllowNull(false)
  @Column
  declare value: string;
}
