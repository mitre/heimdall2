import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt
} from 'sequelize-typescript';
import {Evaluation} from '../evaluations/evaluation.model';
import {GroupEvaluation} from '../group-evaluations/group-evaluation.model';
import {GroupBuild} from '../group-builds/group-build.model';
import {GroupProduct} from '../group-products/group-product.model';
import {GroupUser} from '../group-users/group-user.model';
import {Build} from '../builds/build.model';
import {Product} from '../products/product.model';
import {User} from '../users/user.model';

@Table
export class Group extends Model {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  public!: boolean;

  @AllowNull(false)
  @Default('')
  @Column(DataType.TEXT)
  desc!: string;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: Date;

  @BelongsToMany(() => User, () => GroupUser)
  users!: Array<User & {GroupUser: GroupUser}>;

  @BelongsToMany(() => Evaluation, () => GroupEvaluation)
  evaluations!: Array<Evaluation & {GroupEvaluation: GroupEvaluation}>;

  @BelongsToMany(() => Product, () => GroupProduct)
  products!: Array<Product & {GroupProduct: GroupProduct}>;

  @BelongsToMany(() => Build, () => GroupBuild)
  builds!: Array<Build & {GroupBuild: GroupBuild}>;
}
