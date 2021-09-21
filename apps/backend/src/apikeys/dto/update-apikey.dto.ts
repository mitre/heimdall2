import {IUpdateAPIKey} from '@heimdall/interfaces';
import {IsString} from 'class-validator';

export class UpdateAPIKeyDto implements IUpdateAPIKey {
  @IsString()
  readonly name!: string;

  @IsString()
  readonly currentPassword!: string;
}
