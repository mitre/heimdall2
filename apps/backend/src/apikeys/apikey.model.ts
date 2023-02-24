import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import {User} from '../users/user.model';

@Table
export class ApiKey extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: string;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  apiKey!: string;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: Date;
}
