import {IDeleteEvaluationTag} from '@heimdall/common/interfaces';
import {IsNotEmpty, IsNumberString, IsString, Min} from 'class-validator';

export class DeleteEvaluationTagDto implements IDeleteEvaluationTag {
  @IsNotEmpty()
  @IsNumberString()
  @Min(1)
  readonly id!: string;

  @IsNotEmpty()
  @IsString()
  readonly value!: string;
}
