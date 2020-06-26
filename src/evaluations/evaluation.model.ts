<<<<<<< HEAD
import { Model, Column, Table, CreatedAt, UpdatedAt, PrimaryKey, AllowNull, DataType
} from 'sequelize-typescript';
=======
import { Model, Column, Table, CreatedAt, UpdatedAt, BelongsTo, PrimaryKey, AllowNull, DataType
} from "sequelize-typescript";
>>>>>>> 1e60cf181be85c19cb3db147ff6aef31fa3851e9


@Table
export class Evaluation extends Model<Evaluation> {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id: number;

  @Column
<<<<<<< HEAD
  version: string;
=======
  version!: string;
>>>>>>> 1e60cf181be85c19cb3db147ff6aef31fa3851e9



  @CreatedAt
  @AllowNull(false)
  @Column
  createdAt: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column
  updatedAt: Date;
}
