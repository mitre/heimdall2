import { Column, Model, Table, IsEmail, Unique, AllowNull, CreatedAt, UpdatedAt,
         PrimaryKey, AutoIncrement, DataType
} from 'sequelize-typescript';

@Table
export class User extends Model<User> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @Unique
  @IsEmail
  @AllowNull(false)
  @Column
  email: string;

  @CreatedAt
  @Column
  createdAt: Date;

  @UpdatedAt
  @Column
  updatedAt: Date;
}
