import mock from 'mock-fs';
import { ConfigService } from './config.service';
import { Test } from '@nestjs/testing';

describe('Config Service', () => {
  let configService: ConfigService;
  // Log used because if not here, error is thrown
  console.log();
  mock({
    // No files created (.env file does not exist yet)
  });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigService],
    }).compile();
    
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Test get function when .env file does not exist', () => {

  });

  describe('Tests for the get function', () => {
    // it('should return the correct database name', () => {
    //   expect(configService.get('DATABASE_NAME')).toEqual('heimdallts_jest_testing_service_db');
    // });

    it('should return undefined because env variable does not exist', () => {
      expect(configService.get('INVALID_VARIABLE')).toBe(undefined);
    });

    // it('should return undefined because env variable does not exist', () => {
    //   console.log(configService.get('DATABASE_NAME'));
    //   expect(1).toBe(1);
    //   // expect.assertions(1);
    //   // expect(() => configService.get('DATABASE_NAME')).toThrowError();
    // });
  });

  afterAll(() => {
    mock.restore();
  })
})
