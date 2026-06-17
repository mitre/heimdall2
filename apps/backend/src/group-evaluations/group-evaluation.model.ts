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
  UpdatedAt,
} from 'sequelize-typescript';
import { Evaluation } from '../evaluations/evaluation.model';
import { Group } from '../groups/group.model';

@Table
export class GroupEvaluation extends Model {
  @AllowNull(false)
  @Column(DataType.DATE)
  @CreatedAt
  declare createdAt: Date;

  @Column(DataType.BIGINT)
  @ForeignKey(() => Evaluation)
  declare evaluationId: string;

  @Column(DataType.BIGINT)
  @ForeignKey(() => Group)
  declare groupId: string;

  @AllowNull(false)
  @AutoIncrement
  @Column(DataType.BIGINT)
  @PrimaryKey
  declare id: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  @UpdatedAt
  declare updatedAt: Date;
}
