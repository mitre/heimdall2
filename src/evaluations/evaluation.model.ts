import { Model, Column, Table, CreatedAt, UpdatedAt, PrimaryKey, AllowNull, DataType
} from 'sequelize-typescript';


@Table
export class Evaluation extends Model<Evaluation> {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id: number;

  @Column
  version: string;
  version!: string;



  @CreatedAt
  @AllowNull(false)
  @Column
  createdAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column
  updatedAt: Date;
}
