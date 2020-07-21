import { IsNotEmpty } from 'class-validator';

export class CreateEvaluationDto {

  @IsNotEmpty()
  readonly version: string;

  @IsNotEmpty()
  readonly data: Object;
}
