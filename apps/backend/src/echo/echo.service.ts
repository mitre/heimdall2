import {Injectable, NotFoundException} from '@nestjs/common';
import {ProfileJsonMapping} from './echo.controller';
// import {ApiKey} from './apikey.model';
// import {APIKeyDto} from './dto/apikey.dto';

@Injectable()
export class EchoService {
  // TODO: Fix typing below to be profileJsonsKeyValueMapping
  private readonly profileJsons: ProfileJsonMapping = {
    T1000: {
      'red-hat-8': {
        'cv-141241': {
          githubUrl: 'testing',
          controlText: 'tesing'
        }
      }
    }
  };

  // TODO: Fix unknown below to be profileJsonsKeyValueMapping
  findControlByAttackPatternName(attackPatternName: string): {
    [key: string]: {
      [key: string]: {
        githubUrl: string;
        controlText: string;
      };
    };
  } {
    const profileContent = this.profileJsons[attackPatternName];
    if (profileContent === null) {
      throw new NotFoundException("Couldn't find profile with given name");
    } else {
      return profileContent;
    }
  }
}
