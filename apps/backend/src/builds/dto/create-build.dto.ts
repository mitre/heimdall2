import {ICreateBuild} from '@heimdall/interfaces';
import {IsOptional, IsString, IsArray} from 'class-validator';

export class CreateBuildDto implements ICreateBuild {
  @IsOptional()
  @IsString()
  readonly buildId!: string;

  @IsOptional()
  readonly buildType!: number;

  @IsOptional()
  @IsString()
  readonly branchName!: string;

  @IsOptional()
  @IsArray()
  readonly groups: string[] | undefined;
}
