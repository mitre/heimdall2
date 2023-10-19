import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards
} from '@nestjs/common';
import {JwtAuthGuard} from 'src/guards/jwt-auth.guard';
// import {ApiKeyService} from './apikey.service';
import {EchoService} from './echo.service';

// @UseGuards(APIKeysEnabled)
// @UseInterceptors(LoggingInterceptor)
@Controller('echo')
export class EchoController {
  constructor(private readonly echoService: EchoService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/:attackPatternName')
  async findControlByAttackPatternName(
    @Param('attackPatternName') attackPatternName: string
  ): Promise<{
    [key: string]: {[key: string]: string};
  }> {
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
