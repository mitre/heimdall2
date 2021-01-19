import {IUpdateEvaluationTag} from '@heimdall/interfaces';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString
} from 'class-validator';

export class UpdateEvaluationTagDto implements IUpdateEvaluationTag {
  @IsNotEmpty()
  @IsNumberString()
  readonly id!: string;

  @IsOptional()
  @IsString()
  readonly value!: string;
}
