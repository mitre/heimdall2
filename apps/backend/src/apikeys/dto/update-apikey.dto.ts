import {IUpdateAPIKey} from '@heimdall/interfaces';
import {IsOptional, IsString} from 'class-validator';

export class UpdateAPIKeyDto implements IUpdateAPIKey {
  readonly name!: string;

  @IsOptional()
  @IsString()
  readonly currentPassword!: string;
}
