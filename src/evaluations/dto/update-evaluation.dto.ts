import { IsOptional } from 'class-validator';

export class UpdateEvaluationDto {

  @IsOptional()
  readonly version: string;
}
