import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import {Product} from '../products/product.model';
import {Build} from '../builds/build.model';

@Table
export class ProductBuild extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: string;

  @ForeignKey(() => Product)
  @Column(DataType.BIGINT)
  productId!: string;

  @ForeignKey(() => Build)
  @Column(DataType.BIGINT)
  buildId!: string;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: Date;
}
