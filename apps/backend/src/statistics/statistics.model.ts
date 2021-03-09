import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';

@Table
export class Statistics extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.BIGINT)
  loginCount!: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.BIGINT)
  evaluationCount!: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.BIGINT)
  evaluationTagCount!: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.BIGINT)
  profileCount!: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.BIGINT)
  userCount!: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.BIGINT)
  userGroupCount!: number;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: Date;
}
