import {IsNotEmpty, IsString, IsNumber, Min, Max} from 'class-validator';
import {ICreateEvaluationTag} from '@heimdall/interfaces';

export class CreateEvaluationTagDto implements ICreateEvaluationTag {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(0)
  readonly id: number;

  @IsNotEmpty()
  @IsString()
  readonly key: string;

  @IsNotEmpty()
  @IsString()
  readonly value: string;

  constructor(dto: CreateEvaluationTagDto) {
    this.key = dto.key;
    this.value = dto.value;
  }
}
