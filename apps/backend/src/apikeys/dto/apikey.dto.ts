import {IApiKey} from '@heimdall/interfaces';
import {IsString} from 'class-validator';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  UpdatedAt
} from 'sequelize-typescript';
import {ApiKey} from '../apikey.model';

export class APIKeyDto implements IApiKey {
  @IsString()
  @AllowNull(false)
  @Column(DataType.STRING)
  readonly id!: string;

  @IsString()
  @Column(DataType.STRING)
  readonly name!: string;

  @CreatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: Date;

  constructor(apiKey: ApiKey) {
    this.id = apiKey.id;
    this.name = apiKey.name;
    this.createdAt = apiKey.createdAt;
    this.updatedAt = apiKey.updatedAt;
  }
}
