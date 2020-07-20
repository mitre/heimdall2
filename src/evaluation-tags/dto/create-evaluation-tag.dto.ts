import {IsNotEmpty} from 'class-validator';

export class CreateEvaluationTagDto {
  @IsNotEmpty()
  readonly key: string;

  @IsNotEmpty()
  readonly value: string;
}
