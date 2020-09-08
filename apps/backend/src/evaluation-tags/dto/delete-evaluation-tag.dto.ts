import {IsNotEmpty} from 'class-validator';
import {IDeleteEvaluationTag} from '@heimdall/interfaces';

export class DeleteEvaluationTagDto implements IDeleteEvaluationTag {
  @IsNotEmpty()
  readonly id: number;
}
