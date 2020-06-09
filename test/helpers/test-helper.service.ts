import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../src/database/database.service';
import { ConfigService } from '../../src/config/config.service';

@Injectable()
export class TestHelperService {
  constructor(private databaseService: DatabaseService, private configService: ConfigService) {
    if(configService.get('NODE_ENV') !== 'test') {
      throw new Error('Test Helper is only to be loaded in the Test environment! Check NODE_ENV.')
    }
  }

  async cleanAll() {
    this.databaseService.cleanAll();
  }
}
