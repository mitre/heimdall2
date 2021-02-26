import * as dotenv from 'dotenv';
import mock from 'mock-fs';
import {
  DATABASE_URL_MOCK_ENV,
  ENV_MOCK_FILE,
  SIMPLE_ENV_MOCK_FILE
} from '../../test/constants/env-test.constant';
import {ConfigService} from './config.service';

/* If you run the test without --silent , you need to add console.log() before you mock out the
file system in the beforeAll() or it'll throw an error (this is a documented bug which can be
found at https://github.com/tschaub/mock-fs/issues/234).
If you run the test with --silent (which we do by default), you don't need the log statement. */
describe('Config Service', () => {
  beforeAll(async () => {
    console.log();
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
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unable to read configuration file `.env`!'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Falling back to environment or undefined values!'
      );
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
      expect(configService.get('PORT')).toEqual('8000');
      expect(configService.get('DATABASE_HOST')).toEqual('localhost');
      expect(configService.get('DATABASE_PORT')).toEqual('5432');
      expect(configService.get('DATABASE_USERNAME')).toEqual('postgres');
      expect(configService.get('DATABASE_PASSWORD')).toEqual('postgres');
      expect(configService.get('DATABASE_NAME')).toEqual(
        'heimdallts_jest_testing_service_db'
      );
      expect(configService.get('JWT_SECRET')).toEqual('abc123');
      expect(configService.get('NODE_ENV')).toEqual('test');
    });

    it('should return undefined because env variable does not exist', () => {
      const configService = new ConfigService();
      expect(configService.get('INVALID_VARIABLE')).toBe(undefined);
    });
  });

  describe('Tests the get function when environment file is sourced externally', () => {
    beforeAll(() => {
      // Mock .env file
      mock({
        '.env-loaded-externally': SIMPLE_ENV_MOCK_FILE
      });
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      dotenv.config({path: '.env-loaded-externally'});
    });

    it('should return the correct database port', () => {
      const configService = new ConfigService();
      expect(configService.get('PORT')).toEqual('8001');
    });

    it('should return undefined because env variable does not exist', () => {
      const configService = new ConfigService();
      expect(configService.get('INVALID_VARIABLE')).toBe(undefined);
    });
  });

  describe('When using DATABASE_URL', () => {
    beforeAll(() => {
      mock({
        '.env': DATABASE_URL_MOCK_ENV
      });
    });

    it('should correctly parse DATABASE_URL into its components', () => {
      const configService = new ConfigService();
      expect(configService.get('DATABASE_HOST')).toEqual(
        'ec2-00-000-11-123.compute-1.amazonaws.com'
      );
      expect(configService.get('DATABASE_PORT')).toEqual('5432');
      expect(configService.get('DATABASE_USERNAME')).toEqual(
        'abcdefghijk123456'
      );
      expect(configService.get('DATABASE_PASSWORD')).toEqual(
        '000011112222333344455556666777778889999aaaabbbbccccddddeeeffff'
      );
      expect(configService.get('DATABASE_NAME')).toEqual('database01');
    });
  });

  describe('Tests for thrown errors', () => {
    it('should throw an EACCES error', () => {
      expect.assertions(1);
      mock({
        '.env': mock.file({
          content: 'DATABASE_NAME=heimdallts_jest_testing_service_db',
          mode: 0o000 // Set file system permissions to none
        })
      });
      expect(() => new ConfigService()).toThrowError(
        "EACCES: permission denied, open '.env'"
      );
    });

    it('should throw an error in the get function', () => {
      mock({
        '.env': ENV_MOCK_FILE
      });
      const configService = new ConfigService();
      jest.spyOn(configService, 'get').mockImplementationOnce(() => {
        throw new Error('');
      });
      expect(() => configService.get('DATABASE_NAME')).toThrowError();
    });
  });

  describe('Set', () => {
    it('should set a key value', () => {
      const configService = new ConfigService();
      configService.set('test', 'value');
      expect(configService.get('test')).toBe('value');
    });
  });

  afterAll(() => {
    // Restore the fs binding to the real file system
    mock.restore();
  });
});
