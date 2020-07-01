import mock from 'mock-fs';
import { ConfigService } from './config.service';
import { ENV_MOCK_FILE } from '../../test/constants/env-test.constant';

/* If you run the test without --silent , you need to add console.log() before you mock out the 
file system in the beforeAll() or it'll throw an error (this is a documented bug which can be 
found at https://github.com/tschaub/mock-fs/issues/234). 
If you run the test with --silent (which we do by default), you don't need the log statement. */
describe('Config Service', () => {

  beforeAll(async () => {
    // console.log();
    // Used as an empty file system
    mock({
      // No files created (.env file does not exist yet)
    });
  });

  describe('Tests the get function when .env file does not exist', () => {
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

  describe('Tests the get function when .env file does exist', () => {
    beforeAll(() => {
      // Mock .env file
      mock({
        '.env': ENV_MOCK_FILE
      });
    });

    it('should return the correct database name', () => {
      const configService = new ConfigService();
      expect(configService.get('HEIMDALL_SERVER_PORT')).toEqual('8000');
      expect(configService.get('DATABASE_HOST')).toEqual('localhost');
      expect(configService.get('DATABASE_PORT')).toEqual('5432');
      expect(configService.get('DATABASE_USERNAME')).toEqual('postgres');
      expect(configService.get('DATABASE_PASSWORD')).toEqual('postgres');
      expect(configService.get('DATABASE_NAME')).toEqual('heimdallts_jest_testing_service_db');
      expect(configService.get('JWT_SECRET')).toEqual('abc123');
      expect(configService.get('NODE_ENV')).toEqual('test');
    });

    it('should return undefined because env variable does not exist', () => {
      const configService = new ConfigService();
      expect(configService.get('INVALID_VARIABLE')).toBe(undefined);
    });
  });

  describe('Tests for thrown errors', () => {
    it('should throw an EACCES error', () => {
      expect.assertions(1);
      mock({
        '.env': mock.file({
          content: 'DATABASE_NAME=heimdallts_jest_testing_service_db',
          mode: 0o000, // Set file system permissions to none
        })
      });
      expect(() => new ConfigService()).toThrowError('EACCES: permission denied, open \'.env\'');
    });

    it('should throw an error in the get function', () => {
      mock({
        '.env': ENV_MOCK_FILE
      });
      const configService = new ConfigService();
      jest.spyOn(configService, 'get').mockImplementationOnce(() => { throw new Error('') });
      expect(() => configService.get('DATABASE_NAME')).toThrowError();
    });
  });

  afterAll(() => {
    // Restore the fs binding to the real file system
    mock.restore();
  })
})
