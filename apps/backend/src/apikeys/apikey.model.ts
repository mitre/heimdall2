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

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @BelongsTo(() => Group, { constraints: false })
  declare group: Group;

  @ForeignKey(() => Group)
  @Column(DataType.BIGINT)
  declare groupId: string;

  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare id: string;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare type: string;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @BelongsTo(() => User, { constraints: false })
  declare user: User;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  declare userId: string;
}
