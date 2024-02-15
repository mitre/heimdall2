import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import {Group} from '../groups/group.model';
import {Product} from '../products/product.model';

@Table
export class GroupProduct extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: string;

  @ForeignKey(() => Group)
  @Column(DataType.BIGINT)
  groupId!: string;

  @ForeignKey(() => Product)
  @Column(DataType.BIGINT)
  productId!: string;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: Date;
}
