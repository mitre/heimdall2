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
  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @ForeignKey(() => Evaluation)
  @Column(DataType.BIGINT)
  declare evaluationId: string;

  @ForeignKey(() => Group)
  @Column(DataType.BIGINT)
  declare groupId: string;

  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare id: string;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
