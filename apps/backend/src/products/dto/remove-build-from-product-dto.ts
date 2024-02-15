import {IRemoveBuildFromProduct} from '@heimdall/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class RemoveBuildFromProductDto implements IRemoveBuildFromProduct {
  @IsNotEmpty()
  @IsString()
  readonly buildId!: string;
}
