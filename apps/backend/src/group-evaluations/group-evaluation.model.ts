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
import {Evaluation} from '../evaluations/evaluation.model';
import {Group} from '../groups/group.model';

@Table
export class GroupEvaluation extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: string;

  @ForeignKey(() => Group)
  @Column(DataType.BIGINT)
  groupId!: string;

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
