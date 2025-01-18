import {ICreateApiKey} from '@heimdall/common/interfaces';
import {IsOptional, IsString} from 'class-validator';

export class CreateApiKeyDto implements ICreateApiKey {
  @IsString()
  @IsOptional()
  readonly userId?: string;

  @IsString()
  @IsOptional()
  readonly groupId?: string;

  @IsString()
  @IsOptional()
  readonly userEmail?: string;

  @IsString()
  @IsOptional()
  readonly name?: string;

  @IsString()
  @IsOptional()
  readonly currentPassword!: string;
}
