import { Column, Model, Table, IsEmail, Unique, AllowNull, CreatedAt, UpdatedAt,
  PrimaryKey, AutoIncrement, DataType, Default
} from 'sequelize-typescript';

@Table
export class User extends Model<User> {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id: number;

  @Unique
  @IsEmail
  @AllowNull(false)
  @Column
  email: string;

  @AllowNull(true)
  @Column
  firstName: string;

  @AllowNull(true)
  @Column
  lastName: string;

  @AllowNull(true)
  @Column
  organization: string;

  @AllowNull(true)
  @Column
  title: string;

  @AllowNull(false)
  @Column
  encryptedPassword: string;

  @AllowNull(true)
  @Column
  forcePasswordChange: boolean;

  @AllowNull(true)
  @Column
  passwordChangedAt: Date;

  @AllowNull(false)
  @Default('user')
  @Column
  role: string;

  @CreatedAt
  @AllowNull(false)
  @Column
  createdAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column
  updatedAt: Date;
}
