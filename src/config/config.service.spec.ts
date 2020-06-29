import { ConfigService } from './config.service';
import { Test } from '@nestjs/testing';

describe('Config Service', () => {
  let configService: ConfigService;
  
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigService],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Tests for the get function', () => {
    it('should return the correct database name', () => {
      expect(configService.get('DATABASE_NAME')).toEqual('heimdallts_jest_testing_service_db');
    });

    it('should return undefined because env variable does not exist', () => {
      expect(configService.get('INVALID_VARIABLE')).toBe(undefined);
    });
  });
})
