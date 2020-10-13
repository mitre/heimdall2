import {
  Column,
  Model,
  Table,
  IsEmail,
  Unique,
  AllowNull,
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  AutoIncrement,
  DataType,
  Default
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
  @Column
  email!: string;

  @AllowNull(true)
  @Column
  firstName!: string | null;

  @AllowNull(true)
  @Column
  lastName!: string | null;

  @AllowNull(true)
  @Column
  organization!: string | null;

  @AllowNull(true)
  @Column
  title!: string | null;

  @AllowNull(false)
  @Column
  encryptedPassword!: string;

  @AllowNull(true)
  @Column
  forcePasswordChange!: boolean | null;

  @AllowNull(true)
  @Column
  lastLogin!: Date | null;

  @AllowNull(false)
  @Default(0)
  @Column
  loginCount!: number;

  @AllowNull(true)
  @Column
  passwordChangedAt!: Date | null;

  @AllowNull(false)
  @Default('user')
  @Column
  role!: string;

  @CreatedAt
  @AllowNull(false)
  @Column
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column
  updatedAt!: Date;
}
