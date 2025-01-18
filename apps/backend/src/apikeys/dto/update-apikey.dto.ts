import {IUpdateAPIKey} from '@heimdall/common/interfaces';
import {IsOptional, IsString} from 'class-validator';

export class UpdateAPIKeyDto implements IUpdateAPIKey {
  @IsString()
  readonly name!: string;

  @IsString()
  @IsOptional()
  readonly currentPassword!: string;
}
