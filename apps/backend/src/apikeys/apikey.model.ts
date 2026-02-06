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
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';

@Table
export class ApiKey extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare id: string;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  declare userId: string;

  @ForeignKey(() => Group)
  @Column(DataType.BIGINT)
  declare groupId: string;

  @BelongsTo(() => User, {
    constraints: false
  })
  declare user: User;

  @BelongsTo(() => Group, {
    constraints: false
  })
  declare group: Group;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare apiKey: string;

  @Column(DataType.STRING)
  declare type: string;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
