import {
  Controller,
  Get,
  Query,
  Request,
  UseInterceptors
} from '@nestjs/common';
import S3 from 'aws-sdk/clients/s3';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {User} from '../users/user.model';
import {AuthorizationArtifactService} from './authorization-artifact.service';

@Controller('autharti')
@UseInterceptors(LoggingInterceptor)
export class AuthorizationArtifactController {
  constructor(
    private readonly authorizationArtifactService: AuthorizationArtifactService
  ){}

  @Get()
  async listFiles(@Request() request: {user: User}, @Query('prefix') prefix: string): Promise<S3.ListObjectsV2Output | undefined> {
    return this.authorizationArtifactService.listFiles(prefix);
  }

  @Get('buckets')
  async listBuckets(@Request() request: {user: User}): Promise<S3.ListBucketsOutput | undefined> {
    return this.authorizationArtifactService.listBuckets();
  }

  @Get('sign')
  async getSignedUrl(@Request() request: {user: User}, @Query('key') key: string): Promise<string> {
    console.log(key);
    return this.authorizationArtifactService.getSignedUrl(key);
  }

  @Get('download')
  async downloadFile(@Request() request: {user: User}, @Query('key') key: string): Promise<string> {
    return this.authorizationArtifactService.downloadFile(key);
  }
}
