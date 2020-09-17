import {IsOptional, IsString, IsNumber, IsNotEmpty, Min} from 'class-validator';
import {IUpdateEvaluationTag} from '@heimdall/interfaces';

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
