import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  IsEmail,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt
} from 'sequelize-typescript';
import {GroupUser} from '../group-users/group-user.model';
import {Group} from '../groups/group.model';

@Table
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: string;

  @Unique
  @IsEmail
  @AllowNull(true)
  @Column(DataType.STRING)
  email!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  firstName!: string | undefined;

  @AllowNull(true)
  @Column(DataType.STRING)
  lastName!: string | undefined;

  @AllowNull(true)
  @Column(DataType.STRING)
  organization!: string | undefined;

  @AllowNull(true)
  @Column(DataType.STRING)
  title!: string | undefined;

  @AllowNull(true)
  @Column(DataType.STRING)
  encryptedPassword!: string;

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  forcePasswordChange!: boolean | undefined;

  @AllowNull(true)
  @Column(DataType.DATE)
  lastLogin!: Date | undefined;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.BIGINT)
  loginCount!: number;

  @AllowNull(true)
  @Column(DataType.DATE)
  passwordChangedAt!: Date | undefined;

  @AllowNull(false)
  @Default('user')
  @Column(DataType.STRING)
  role!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  creationMethod!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  jwtSecret!: string;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @BelongsToMany(() => Group, () => GroupUser)
  groups!: Array<Group & {GroupUser: GroupUser}>;
}
