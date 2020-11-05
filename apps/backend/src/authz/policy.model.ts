import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';

@Table
export class Policy extends Model<Policy> {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: number;

  @AllowNull(false)
  @Column
  role!: string;

  @AllowNull(false)
  @Column
  actions!: string;

  @AllowNull(false)
  @Column
  targets!: string;

  @Column(DataType.JSON)
  attributes!: any;

  @Column
  condition!: string;

  @CreatedAt
  @AllowNull(false)
  @Column
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column
  updatedAt!: Date;
}
