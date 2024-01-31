import {IAddBuildToProduct} from '@heimdall/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class AddBuildToProductDto implements IAddBuildToProduct {
  @IsNotEmpty()
  @IsString()
  readonly buildId!: string;
}
