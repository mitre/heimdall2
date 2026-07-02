import { ICreateApiKey } from '@heimdall/common/interfaces';
import { IsOptional, IsString } from 'class-validator';

export class CreateApiKeyDto implements ICreateApiKey {
  @IsOptional()
  @IsString()
  readonly currentPassword!: string;

  @IsOptional()
  @IsString()
  readonly groupId?: string;

  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  @IsString()
  readonly userEmail?: string;

  @IsOptional()
  @IsString()
  readonly userId?: string;
}
