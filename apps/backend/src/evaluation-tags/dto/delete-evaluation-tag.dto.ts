import {IsNotEmpty, IsNumber, Min} from 'class-validator';
import {IDeleteEvaluationTag} from '@heimdall/interfaces';

export class DeleteEvaluationTagDto implements IDeleteEvaluationTag {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  readonly id: number;
}
