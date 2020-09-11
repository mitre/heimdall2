import {IsNotEmpty, IsNumber, Min, IsString} from 'class-validator';
import {IDeleteEvaluationTag} from '@heimdall/interfaces';

export class DeleteEvaluationTagDto implements IDeleteEvaluationTag {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  readonly id: number;

  @IsNotEmpty()
  @IsString()
  readonly key: string;

  @IsNotEmpty()
  @IsString()
  readonly value: string;
}
