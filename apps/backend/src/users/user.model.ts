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
  UpdatedAt,
} from 'sequelize-typescript';
import { GroupUser } from '../group-users/group-user.model';
import { Group } from '../groups/group.model';

@Table
export class User extends Model {
  @AllowNull(false)
  @Column(DataType.DATE)
  @CreatedAt
  declare createdAt: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare creationMethod: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  @IsEmail
  @Unique
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare encryptedPassword: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare firstName: string | undefined;

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  declare forcePasswordChange: boolean | undefined;

  @BelongsToMany(() => Group, () => GroupUser)
  declare groups: (Group & { GroupUser: GroupUser })[];

  @AllowNull(false)
  @AutoIncrement
  @Column(DataType.BIGINT)
  @PrimaryKey
  declare id: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare jwtSecret: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastLogin: Date | undefined;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare lastName: string | undefined;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  @Default(0)
  declare loginCount: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare organization: string | undefined;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare passwordChangedAt: Date | undefined;

  @AllowNull(false)
  @Column(DataType.STRING)
  @Default('user')
  declare role: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare title: string | undefined;

  @AllowNull(false)
  @Column(DataType.DATE)
  @UpdatedAt
  declare updatedAt: Date;
}
