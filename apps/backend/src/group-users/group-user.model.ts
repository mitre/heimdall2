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
  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @ForeignKey(() => Group)
  @Column(DataType.BIGINT)
  declare groupId: string;

  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Default('member')
  @Column(DataType.STRING)
  declare role: string;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  declare userId: string;
}
