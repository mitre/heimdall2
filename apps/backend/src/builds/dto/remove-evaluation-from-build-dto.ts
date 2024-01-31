import {IRemoveEvaluationFromBuild} from '@heimdall/interfaces';
import {IsNotEmpty, IsString} from 'class-validator';

export class RemoveEvaluationFromBuildDto implements IRemoveEvaluationFromBuild {
  @IsNotEmpty()
  @IsString()
  readonly evaluationId!: string;
}
