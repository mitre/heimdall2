import {IAddEvaluationToBuild} from '@heimdall/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class AddEvaluationToBuildDto implements IAddEvaluationToBuild {
  @IsNotEmpty()
  @IsString()
  readonly evaluationId!: string;
}
