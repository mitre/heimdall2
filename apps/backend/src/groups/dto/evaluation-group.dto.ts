import {IEvaluationGroup} from '@heimdall/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class EvaluationGroupDto implements IEvaluationGroup {
  @IsNotEmpty()
  @IsString()
  readonly id!: string;
}
