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
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column
  value!: string;

  @Column
  declare createdAt: Date;

  @Column
  declare updatedAt: Date;

  @ForeignKey(() => Evaluation)
  @Column(DataType.BIGINT)
  evaluationId!: string;

  @BelongsTo(() => Evaluation)
  evaluation!: Evaluation;
}
