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
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare id: string;

  @Unique
  @IsEmail
  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare firstName: string | undefined;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare lastName: string | undefined;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare organization: string | undefined;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare title: string | undefined;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare encryptedPassword: string;

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  declare forcePasswordChange: boolean | undefined;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastLogin: Date | undefined;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.BIGINT)
  declare loginCount: number;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare passwordChangedAt: Date | undefined;

  @AllowNull(false)
  @Default('user')
  @Column(DataType.STRING)
  declare role: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare creationMethod: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare jwtSecret: string;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  declare updatedAt: Date;

  @BelongsToMany(() => Group, () => GroupUser)
  declare groups: Array<Group & {GroupUser: GroupUser}>;
}
