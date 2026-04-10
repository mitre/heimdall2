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
  declare id: string;

  @AllowNull(false)
  @Column
  declare value: string;

  @AllowNull(false)
  @Column
  declare createdAt: Date;

  @AllowNull(false)
  @Column
  declare updatedAt: Date;

  @ForeignKey(() => Evaluation)
  @Column(DataType.BIGINT)
  declare evaluationId: string;

  @BelongsTo(() => Evaluation)
  declare evaluation: Evaluation;
}
