import {IUpdateEvaluationTag} from '@heimdall/interfaces';
import {IsNotEmpty, IsNumber, IsOptional, IsString, Min} from 'class-validator';

export class UpdateEvaluationTagDto implements IUpdateEvaluationTag {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  readonly id: number;

  @IsOptional()
  @IsString()
  readonly key: string;

  @IsOptional()
  @IsString()
  readonly value: string;

  constructor(dto: UpdateEvaluationTagDto) {
    this.id = dto.id;
    this.key = dto.key;
    this.value = dto.value;
  }
}
