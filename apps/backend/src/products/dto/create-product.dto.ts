import {ICreateProduct} from '@heimdall/interfaces';
import {IsOptional, IsString, IsArray} from 'class-validator';

export class CreateProductDto implements ICreateProduct {
  @IsOptional()
  @IsString()
  readonly productName!: string;

  @IsOptional()
  @IsString()
  readonly productId!: string;

  @IsOptional()
  @IsString()
  readonly productURL!: string;

  @IsOptional()
  @IsString()
  readonly objectStoreKey!: string;

  @IsOptional()
  @IsArray()
  readonly groups: string[] | undefined;
}
