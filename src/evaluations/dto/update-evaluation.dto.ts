import { IsOptional } from 'class-validator';

export class UpdateEvaluationDto {

  @IsOptional()
  readonly version: string;

  @IsOptional()
  readonly data: Object;
}
