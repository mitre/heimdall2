import * as dotenv from 'dotenv';
import mock from 'mock-fs';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import AppConfig from '../../config/app_config';
import {
  DATABASE_URL_MOCK_ENV,
  ENV_MOCK_FILE,
  SIMPLE_ENV_MOCK_FILE
} from '../../test/constants/env-test.constant';
import {ConfigService} from './config.service';

// If you run the test without --silent , you need to add console.log() before you mock out the file system in the beforeAll() or it'll throw an error (this is a documented bug which can be found at https://github.com/tschaub/mock-fs/issues/234). If you run the test with --silent (which we do by default), you don't need the log statement.
describe('Config Service', () => {
  beforeAll(async () => {
    // eslint-disable-next-line no-console
    console.log();
    // Used as an empty file system
    mock({
      // No files created (.env file does not exist yet), but pull through node_modules so the testing framework can run
      node_modules: mock.load('node_modules')
    });
  });

  afterAll(() => {
    // Restore the fs binding to the real file system
    mock.restore();
  });

  describe('Tests the get function when .env file does not exist', () => {
    it('should return undefined because env variable does not exist', () => {
      const configService = new ConfigService();
      expect(configService.get('DATABASE_NAME')).toBe(undefined);
    });

    it('should print to the console about how it was unable to read .env file', () => {
      const consoleSpy = vi.spyOn(console, 'log');
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
        'heimdallts_vitest_testing_service_db'
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

    it.each([
      ['alice:alpha:beta:gamma', 'alice', 'alpha:beta:gamma'],
      ['alice::secret:', 'alice', ':secret:'],
      ['alice:alpha%3Abeta', 'alice', 'alpha:beta'],
      ['alice%3Aadmin:secret', 'alice:admin', 'secret'],
      ['alice%40team:p%40ss%2Fword%3F%23%25', 'alice@team', 'p@ss/word?#%'],
    ])('should parse credentials %s', (credentials, username, password) => {
      vi.stubEnv('DATABASE_URL', `postgres://${credentials}@localhost:5432/app`);
      const configService = new ConfigService();
      expect(configService.getDbConfig()).toMatchObject({
        database: 'app',
        host: 'localhost',
        password,
        port: 5432,
        username,
      });
    });

    it.each([
      ['[2001:db8::1]:5433/app:archive', 5433],
      ['[2001:db8::1]/app:archive', 5432],
      ['%5B2001%3Adb8%3A%3A1%5D:5433/app:archive', 5433],
      ['localhost:5433/app:archive?host=%5B2001%3Adb8%3A%3A1%5D', 5433],
    ])(
      'should parse IPv6 connection %s',
      (connection, port) => {
        vi.stubEnv('DATABASE_URL', `postgres://alice:secret@${connection}`);
        expect(new ConfigService().getDbConfig()).toMatchObject({
          database: 'app:archive',
          host: '2001:db8::1',
          port,
        });
      },
    );

    it('should preserve defaults for omitted URL components', () => {
      vi.stubEnv('DATABASE_URL', 'postgres://localhost');
      vi.stubEnv('NODE_ENV', 'test');
      expect(new ConfigService().getDbConfig()).toMatchObject({
        database: 'heimdall-server-test',
        host: 'localhost',
        password: '',
        port: 5432,
        username: 'postgres',
      });
    });

    it('should use URL query options and preserve environment overrides', () => {
      vi.stubEnv(
        'DATABASE_URL',
        'postgres://alice:secret@localhost:5432/app?host=other&port=5433#fragment',
      );
      vi.stubEnv('DATABASE_USERNAME', 'override');
      vi.stubEnv('DATABASE_PASSWORD', 'override:password');
      vi.stubEnv('DATABASE_SSL', 'false');
      expect(new ConfigService().getDbConfig()).toMatchObject({
        database: 'app',
        dialectOptions: { ssl: false },
        host: 'other',
        password: 'override:password',
        port: 5433,
        username: 'override',
      });
    });

    it.each([
      'postgres://alice:secret@localhost:abc/app',
      'postgres://alice:secret@[invalid/app',
      'postgres://alice:%FF@localhost/app',
      'postgres://localhost/app?sslcert=/missing.pem',
    ])('should return false and preserve settings when parsing fails for %s', (url) => {
      mock({ '.env': ENV_MOCK_FILE });
      vi.stubEnv('DATABASE_URL', url);
      const config = new AppConfig();
      expect(config.parseDatabaseUrl()).toBe(false);
      expect(config.getDbConfig()).toMatchObject({
        database: 'heimdallts_vitest_testing_service_db',
        host: 'localhost',
        password: 'postgres',
        port: 5432,
        username: 'postgres',
      });
    });

    it('should preserve environment overrides for the host and port', () => {
      vi.stubEnv('DATABASE_URL', 'postgres://localhost/app?host=other&port=5433');
      vi.stubEnv('DATABASE_HOST', 'override');
      vi.stubEnv('DATABASE_PORT', '5434');
      const config = new ConfigService().getDbConfig();
      expect(config).toMatchObject({ host: 'override', port: 5434 });
      expect(config.dialectOptions).not.toHaveProperty('host');
      expect(config.dialectOptions).not.toHaveProperty('port');
    });

    it.each(['', ' \t '])('should preserve individual settings for a blank .env URL %j', (url) => {
      mock({ '.env': `${ENV_MOCK_FILE}DATABASE_URL="${url}"\n` });
      vi.stubEnv('DATABASE_URL', undefined);
      expect(new ConfigService().getDbConfig()).toMatchObject({
        database: 'heimdallts_vitest_testing_service_db',
        host: 'localhost',
        password: 'postgres',
        port: 5432,
        username: 'postgres',
      });
    });

    it.each(['', ' \t '])('should preserve individual settings for a blank environment URL %j', (url) => {
      mock({ '.env': ENV_MOCK_FILE });
      vi.stubEnv('DATABASE_URL', url);
      expect(new ConfigService().getDbConfig()).toMatchObject({
        database: 'heimdallts_vitest_testing_service_db',
        host: 'localhost',
        password: 'postgres',
        port: 5432,
        username: 'postgres',
      });
    });
  });

  describe('Tests for thrown errors', () => {
    it('should throw an EACCES error', () => {
      expect.assertions(1);
      mock({
        '.env': mock.file({
          content: 'DATABASE_NAME=heimdallts_vitest_testing_service_db',
          mode: 0o000 // Set file system permissions to none
        })
      });
      expect(() => new ConfigService()).toThrowError(
        "EACCES, permission denied '.env'"
      );
    });

    it('should throw an error in the get function', () => {
      mock({
        '.env': ENV_MOCK_FILE
      });
      const configService = new ConfigService();
      vi.spyOn(configService, 'get').mockImplementationOnce(() => {
        throw new Error('Test error');
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
});
