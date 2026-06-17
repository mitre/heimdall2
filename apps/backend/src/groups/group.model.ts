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
  UpdatedAt,
} from 'sequelize-typescript';
import { Evaluation } from '../evaluations/evaluation.model';
import { GroupEvaluation } from '../group-evaluations/group-evaluation.model';
import { GroupUser } from '../group-users/group-user.model';
import { User } from '../users/user.model';

@Table
export class Group extends Model {
  @AllowNull(false)
  @Column(DataType.DATE)
  @CreatedAt
  declare createdAt: Date;

  @AllowNull(false)
  @Column(DataType.TEXT)
  @Default('')
  declare desc: string;

  @BelongsToMany(() => Evaluation, () => GroupEvaluation)
  declare evaluations: (Evaluation & { GroupEvaluation: GroupEvaluation })[];

  @AllowNull(false)
  @AutoIncrement
  @Column(DataType.BIGINT)
  @PrimaryKey
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  @Unique
  declare name: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  @Default(false)
  declare public: boolean;

  @AllowNull(false)
  @Column(DataType.DATE)
  @UpdatedAt
  declare updatedAt: Date;

  @BelongsToMany(() => User, () => GroupUser)
  declare users: (User & { GroupUser: GroupUser })[];
}
