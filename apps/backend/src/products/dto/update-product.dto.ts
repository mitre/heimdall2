import {IUpdateProduct} from '@heimdall/interfaces';
import {IsOptional, IsString} from 'class-validator';

export class UpdateProductDto implements IUpdateProduct {
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
}
