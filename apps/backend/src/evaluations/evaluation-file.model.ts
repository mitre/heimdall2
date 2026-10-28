/* eslint-disable unicorn/filename-case, perfectionist/sort-decorators -- Match module filenames; Sequelize requires Column to execute before attribute decorators. */
import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

// One original upload can be referenced by many generated evaluations.
@Table
export class EvaluationFile extends Model {
  @CreatedAt
  @AllowNull(false)
  @Column
  declare createdAt: Date;

  @AllowNull(false)
  @Column(DataType.BLOB)
  declare data: Buffer;

  @AllowNull(false)
  @Column
  declare filename: string;

  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.BIGINT)
  declare id: string;

  @AllowNull(false)
  @Column
  declare role: string;

  @UpdatedAt
  @AllowNull(false)
  @Column
  declare updatedAt: Date;
}
/* eslint-enable unicorn/filename-case, perfectionist/sort-decorators */
