import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import {TenableCredentialsDto} from './dto/tenable-credentials.dto';
import {TenableService} from './tenable.service';

@Controller('tenable')
export class TenableController {
  constructor(private readonly tenableService: TenableService) {}

  @Get('scan-results')
  @UsePipes(new ValidationPipe({transform: true}))
  async getScanResults(
    @Query() credentials: TenableCredentialsDto,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string
  ) {
    return this.tenableService.getScanResults(
      credentials.host,
      credentials.apiKey,
      credentials.apiSecret,
      startTime,
      endTime
    );
  }

  @Get('scan-results/:resultId')
  @UsePipes(new ValidationPipe({transform: true}))
  async getScanResult(
    @Query() credentials: TenableCredentialsDto,
    @Param('resultId') resultId: string
  ) {
    return this.tenableService.getScanResult(
      credentials.host,
      credentials.apiKey,
      credentials.apiSecret,
      resultId
    );
  }

  @Get('vulnerabilities/:resultId')
  @UsePipes(new ValidationPipe({transform: true}))
  async getVulnerabilities(
    @Query() credentials: TenableCredentialsDto,
    @Param('resultId') resultId: string
  ) {
    return this.tenableService.getVulnerabilities(
      credentials.host,
      credentials.apiKey,
      credentials.apiSecret,
      resultId
    );
  }
}
