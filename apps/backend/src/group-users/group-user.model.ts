import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';

@Table
export class GroupUser extends Model {
  @AllowNull(false)
  @Column(DataType.DATE)
  @CreatedAt
  declare createdAt: Date;

  @Column(DataType.BIGINT)
  @ForeignKey(() => Group)
  declare groupId: string;

  @AllowNull(false)
  @AutoIncrement
  @Column(DataType.BIGINT)
  @PrimaryKey
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  @Default('member')
  declare role: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  @UpdatedAt
  declare updatedAt: Date;

  @Column(DataType.BIGINT)
  @ForeignKey(() => User)
  declare userId: string;
}
