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
  userId!: string;

  @ForeignKey(() => Group)
  @Column(DataType.BIGINT)
  groupId!: string;

  @BelongsTo(() => User, {
    constraints: false
  })
  user!: User;

  @BelongsTo(() => Group, {
    constraints: false
  })
  group!: Group;

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  apiKey!: string;

  @Column(DataType.STRING)
  type!: string;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
