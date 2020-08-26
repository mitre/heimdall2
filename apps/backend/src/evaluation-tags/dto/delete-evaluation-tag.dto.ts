import {IsNotEmpty} from 'class-validator';

export class DeleteEvaluationTagDto {
  @IsNotEmpty()
  readonly id: number;
}
