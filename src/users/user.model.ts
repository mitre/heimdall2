import { Column, Model, Table, IsEmail, Unique, AllowNull, CreatedAt, UpdatedAt,
         PrimaryKey, AutoIncrement, DataType
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

  @CreatedAt
  @AllowNull(false)
  @Column
  createdAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column
  updatedAt: Date;
}
