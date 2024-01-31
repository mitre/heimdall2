import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import {Build} from '../builds/build.model';
import {Evaluation} from '../evaluations/evaluation.model';

@Table
export class BuildEvaluation extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: string;

  @ForeignKey(() => Build)
  @Column(DataType.BIGINT)
  buildId!: string;

  @ForeignKey(() => Evaluation)
  @Column(DataType.BIGINT)
  evaluationId!: string;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: Date;
}
