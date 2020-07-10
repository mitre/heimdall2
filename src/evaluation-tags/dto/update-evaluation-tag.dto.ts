import { IsOptional } from "class-validator";

export class UpdateEvaluationTagDto {
  @IsOptional()
  readonly key: string;

  @IsOptional()
  readonly value: string;
}
