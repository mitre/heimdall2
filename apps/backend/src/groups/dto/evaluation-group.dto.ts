import {IEvaluationGroup} from '@heimdall/common/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class EvaluationGroupDto implements IEvaluationGroup {
  @IsNotEmpty()
  @IsString()
  readonly id!: string;
}
