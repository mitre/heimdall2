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
  UpdatedAt,
} from 'sequelize-typescript';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';

@Table
export class ApiKey extends Model {
  @Column(DataType.STRING)
  declare apiKey: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  @CreatedAt
  declare createdAt: Date;

  @BelongsTo(() => Group, { constraints: false })
  declare group: Group;

  @Column(DataType.BIGINT)
  @ForeignKey(() => Group)
  declare groupId: string;

  @AllowNull(false)
  @AutoIncrement
  @Column(DataType.BIGINT)
  @PrimaryKey
  declare id: string;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare type: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => User, { constraints: false })
  declare user: User;

  @Column(DataType.BIGINT)
  @ForeignKey(() => User)
  declare userId: string;
}
