import mock from 'mock-fs';
import { ConfigService } from './config.service';

describe('Config Service', () => {

  beforeAll(async () => {
    // Used as an empty file system
    mock({
      // No files created (.env file does not exist yet)
    });
  });

  describe('Test get function when .env file does not exist', () => {
    it('should return undefined because env variable does not exist', () => {
      const configService = new ConfigService();
      expect(configService.get('DATABASE_NAME')).toBe(undefined);
    });

    it('should print to the console about how it was unable to read .env file', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      // Used to make sure logs are outputted
      new ConfigService();
      expect(consoleSpy).toHaveBeenCalledWith('Unable to read configuration file `.env`!')
      expect(consoleSpy).toHaveBeenCalledWith('Does the file exist and is it readable by the current user?')
      expect(consoleSpy).toHaveBeenCalledWith('Falling back to default or undefined values!')
    });
  });

  describe('Tests get function when .env file does exist', () => {
    beforeAll(() => {
      // Restore the fs binding to the real file system
      mock.restore();
    });

    it('should return the correct database name', () => {
      const configService = new ConfigService();
      expect(configService.get('DATABASE_NAME')).toEqual('heimdallts_jest_testing_service_db');
    });

    it('should return undefined because env variable does not exist', () => {
      const configService = new ConfigService();
      expect(configService.get('INVALID_VARIABLE')).toBe(undefined);
    });
  });

  afterAll(() => {
    // Restore the fs binding to the real file system
    mock.restore();
  })
})
