import {IUpdateEvaluation} from '@heimdall/interfaces';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {IsBoolean, IsObject, IsOptional, IsString} from 'class-validator';

export class UpdateEvaluationDto implements IUpdateEvaluation {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "The new filename for the HDF file at the given ID.",
    example: "RHEL7-results.json"
  })
  readonly filename: string | undefined;

  @IsOptional()
  @IsObject()
  @ApiHideProperty()
  readonly data: Record<string, unknown> | undefined;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: "Public HDF files are visible to any user. Non-public files are only visible to the uploader or the group associated with the file."
  })
  readonly public: boolean | undefined;
}
