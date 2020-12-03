import {Sequelize} from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
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

@Table
export class User extends Model<User> {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: number;

  @Unique
  @IsEmail
  @AllowNull(false)
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

  @AllowNull(false)
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

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: Date;
}
