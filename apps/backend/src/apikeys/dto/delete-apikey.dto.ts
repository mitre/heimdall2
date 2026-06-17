import { IDeleteApiKey } from '@heimdall/common/interfaces';
import { IsOptional, IsString } from 'class-validator';

export class DeleteAPIKeyDto implements IDeleteApiKey {
  @IsOptional()
  @IsString()
  readonly currentPassword!: string;
}
