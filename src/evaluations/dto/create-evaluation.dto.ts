import { IsOptional } from 'class-validator';

export class CreateEvaluationDto {

  @IsOptional()
  readonly version: string;
}
