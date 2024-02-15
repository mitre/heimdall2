import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from 'sequelize-typescript';
import {Build} from '../builds/build.model';
import {ProductBuild} from '../product-builds/product-builds.model';
import {GroupProduct} from '../group-products/group-product.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';

@Table
export class Product extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: string;

  @AllowNull(false)
  @Column
  productName!: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  productId!: string;

  @AllowNull(true)
  @Column
  productURL!: string;

  @AllowNull(true)
  @Column
  objectStoreKey!: string;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: Date;

  @BelongsToMany(() => Build, () => ProductBuild)
  builds!: Array<Build & {ProductBuild: ProductBuild}>;

  @BelongsToMany(() => Group, () => GroupProduct)
  groups!: Array<Group & {GroupProduct: GroupProduct}>;

  @ForeignKey(() => Group)
  @Column(DataType.BIGINT)
  groupId!: string;

  @ForeignKey(() => User)
  @Column(DataType.BIGINT)
  userId!: string;

  @BelongsTo(() => User, {
    constraints: false
  })
  user!: User;
}
