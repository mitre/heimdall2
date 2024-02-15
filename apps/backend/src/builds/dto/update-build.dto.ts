import {IUpdateBuild} from '@heimdall/interfaces';
import {IsOptional, IsString} from 'class-validator';

export class UpdateBuildDto implements IUpdateBuild {
  @IsOptional()
  @IsString()
  readonly buildId!: string;

  @IsOptional()
  readonly buildType!: number;

  @IsOptional()
  @IsString()
  readonly branchName!: string;
}
