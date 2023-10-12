import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {JwtAuthGuard} from 'src/guards/jwt-auth.guard';
// import {ApiKeyService} from './apikey.service';
import {LoggingInterceptor} from 'src/interceptors/logging.interceptor';
import {EchoService} from './echo.service';

export type ProfileJsonMapping = {
  [key: string]: {
    [key: string]: {
      [key: string]: {
        githubUrl: string;
        controlText: string;
      };
    };
  };
};

// @UseGuards(APIKeysEnabled)
@UseInterceptors(LoggingInterceptor)
@Controller('echo')
export class EchoController {
  constructor(private readonly echoService: EchoService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/:attackPatternName')
  async findControlByAttackPatternName(
    @Param('attackPatternName') attackPatternName: string
    // @Request() request: {user: User}
    // TODO: Fix unknown below to be profileJsonsKeyValueMapping
  ): Promise<{
    [key: string]: unknown;
    // [key: string]: {
    //   [key: string]: {
    //     githubUrl: string;
    //     controlText: string;
    //   };
    // };
  }> {
    // //const abac = this.authz.abac.createForUser(request.user);
    if (attackPatternName) {
      const getProfileContent =
        this.echoService.findControlByAttackPatternName(attackPatternName);
      if (getProfileContent == null) {
        throw new BadRequestException(
          'There are no profiles associated with that attack pattern'
        );
      }
      // //ForbiddenError.from(abac).throwUnlessCan(Action.Read, getProfileContent);
      return getProfileContent;
    } else {
      throw new BadRequestException('Need to specify a attack pattern name');
    }
  }
}
