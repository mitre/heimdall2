import {IDeleteEvaluationTag} from '@heimdall/interfaces';
import {IsNotEmpty, IsNumber, IsString, Min} from 'class-validator';

export class DeleteEvaluationTagDto implements IDeleteEvaluationTag {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  readonly id!: number;

  @IsNotEmpty()
  @IsString()
  readonly key!: string;

  @IsNotEmpty()
  @IsString()
  readonly value!: string;
}
