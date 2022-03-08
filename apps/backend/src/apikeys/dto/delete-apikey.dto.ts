import {IDeleteApiKey} from '@heimdall/interfaces';
import {IsOptional, IsString} from 'class-validator';

export class DeleteAPIKeyDto implements IDeleteApiKey {
  @IsString()
  @IsOptional()
  readonly currentPassword!: string;
}
