import { IUpdateEvaluation } from '@heimdall/common/interfaces';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateEvaluationDto implements IUpdateEvaluation {
  @IsObject()
  @IsOptional()
  readonly data: Record<string, unknown> | undefined;

  @IsOptional()
  @IsString()
  readonly filename: string | undefined;

  @IsBoolean()
  @IsOptional()
  readonly public: boolean | undefined;
}
