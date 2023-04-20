import {IsNotEmpty, IsString} from 'class-validator';

export class TenableCredentialsDto {
  @IsNotEmpty()
  @IsString()
  host!: string;

  @IsNotEmpty()
  @IsString()
  apiKey!: string;

  @IsNotEmpty()
  @IsString()
  apiSecret!: string;
}
