import * as dotenv from 'dotenv';
import mock, { file, load, restore } from 'mock-fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  DATABASE_URL_MOCK_ENV,
  DATABASE_URL_WITH_QUERY_MOCK_ENV,
  ENV_MOCK_FILE,
  GITLAB_BOTH_SECRETS_ENV,
  GITLAB_CANONICAL_SECRET_ENV,
  GITLAB_EMPTY_CANONICAL_SECRET_ENV,
  GITLAB_LEGACY_SECRET_ENV,
  SIMPLE_ENV_MOCK_FILE,
} from '../../test/constants/environment-test.constant';
import { ConfigService } from './config.service';
import { resolveSslMaterial } from '../../config/app-config';

// If you run the test without --silent , you need to add console.log() before you mock out the file system in the beforeAll() or it'll throw an error (this is a documented bug which can be found at https://github.com/tschaub/mock-fs/issues/234). If you run the test with --silent (which we do by default), you don't need the log statement.
describe('Config Service', () => {
  beforeAll(() => {
    console.log();
    // Used as an empty file system
    mock({
      // No files created (.env file does not exist yet), but pull through node_modules so the testing framework can run
      node_modules: load('node_modules'),
    });
  });

  afterAll(() => {
    // Restore the fs binding to the real file system
    restore();
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
        'Unable to read configuration file `.env`!',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Falling back to environment or undefined values!',
      );
    });
  });

  describe('Tests the get function when .env file does exist', () => {
    beforeAll(() => {
      // Mock .env file
      mock({ '.env': ENV_MOCK_FILE });
    });

    it('should return the correct database name', () => {
      const configService = new ConfigService();
      expect(configService.get('PORT')).toEqual('8000');
      expect(configService.get('DATABASE_HOST')).toEqual('localhost');
      expect(configService.get('DATABASE_PORT')).toEqual('5432');
      expect(configService.get('DATABASE_USERNAME')).toEqual('postgres');
      expect(configService.get('DATABASE_PASSWORD')).toEqual('postgres');
      expect(configService.get('DATABASE_NAME')).toEqual(
        'heimdallts_vitest_testing_service_db',
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
      mock({ '.env-loaded-externally': SIMPLE_ENV_MOCK_FILE });

      dotenv.config({ path: '.env-loaded-externally' });
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
      mock({ '.env': DATABASE_URL_MOCK_ENV });
    });

    it('should correctly parse DATABASE_URL into its components', () => {
      const configService = new ConfigService();
      expect(configService.get('DATABASE_HOST')).toEqual(
        'ec2-00-000-11-123.compute-1.amazonaws.com',
      );
      expect(configService.get('DATABASE_PORT')).toEqual('5432');
      expect(configService.get('DATABASE_USERNAME')).toEqual(
        'abcdefghijk123456',
      );
      expect(configService.get('DATABASE_PASSWORD')).toEqual(
        '000011112222333344455556666777778889999aaaabbbbccccddddeeeffff',
      );
      expect(configService.get('DATABASE_NAME')).toEqual('database01');
    });
  });

  describe('When DATABASE_URL carries query parameters', () => {
    beforeAll(() => {
      mock({ '.env': DATABASE_URL_WITH_QUERY_MOCK_ENV });
    });

    it('should parse every component and keep the query out of them', () => {
      const configService = new ConfigService();
      expect(configService.get('DATABASE_HOST')).toEqual('db.internal.example');
      expect(configService.get('DATABASE_PORT')).toEqual('6432');
      expect(configService.get('DATABASE_USERNAME')).toEqual('queryuser');
      expect(configService.get('DATABASE_PASSWORD')).toEqual('querypass');
      expect(configService.get('DATABASE_NAME')).toEqual('database02');
    });
  });

  describe('Tests for thrown errors', () => {
    it('should throw an EACCES error', () => {
      expect.assertions(1);
      mock({
        '.env': file({
          content: 'DATABASE_NAME=heimdallts_vitest_testing_service_db',
          mode: 0o000, // Set file system permissions to none
        }),
      });
      expect(() => new ConfigService()).toThrowError(
        "EACCES, permission denied '.env'",
      );
    });

    it('should throw an error in the get function', () => {
      mock({ '.env': ENV_MOCK_FILE });
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

  // GITLAB_CLIENTSECRET is canonical — it matches GITHUB_CLIENTSECRET /
  // GOOGLE_CLIENTSECRET / OKTA_CLIENTSECRET and is the name .env-example and
  // the RPM man page have always documented. GITLAB_SECRET is the legacy name
  // gitlab.strategy.ts actually read, so both must resolve or every deployment
  // configured from either source breaks.
  describe('getGitlabClientSecret', () => {
    it('should resolve the canonical GITLAB_CLIENTSECRET', () => {
      mock({ '.env': GITLAB_CANONICAL_SECRET_ENV });
      const configService = new ConfigService();
      expect(configService.getGitlabClientSecret()).toEqual('canonical-secret');
    });

    it('should resolve the legacy GITLAB_SECRET when the canonical name is unset', () => {
      mock({ '.env': GITLAB_LEGACY_SECRET_ENV });
      const configService = new ConfigService();
      expect(configService.getGitlabClientSecret()).toEqual('legacy-secret');
    });

    it('should prefer the canonical name when both are set', () => {
      mock({ '.env': GITLAB_BOTH_SECRETS_ENV });
      const configService = new ConfigService();
      expect(configService.getGitlabClientSecret()).toEqual('canonical-secret');
    });

    it('should treat an empty canonical value as unset and fall back to the legacy name', () => {
      mock({ '.env': GITLAB_EMPTY_CANONICAL_SECRET_ENV });
      const configService = new ConfigService();
      expect(configService.getGitlabClientSecret()).toEqual('legacy-secret');
    });

    it('should return undefined when neither name is set', () => {
      mock({ '.env': SIMPLE_ENV_MOCK_FILE });
      const configService = new ConfigService();
      expect(configService.getGitlabClientSecret()).toBe(undefined);
    });
  });
});

describe('resolveSslMaterial', () => {
  const PEM
    = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';

  it('passes inline PEM material through untouched', () => {
    expect(resolveSslMaterial(PEM, 'CA')).toBe(PEM);
  });

  it('reads PEM material from a deployer-specified path', () => {
    mock({ '/certs/ca.pem': PEM });
    expect(resolveSslMaterial('/certs/ca.pem', 'CA').toString()).toBe(PEM);
    restore();
  });

  it('throws a labeled error for a missing file', () => {
    mock({});
    expect(() => resolveSslMaterial('/certs/missing.pem', 'CA')).toThrowError(
      'SSL CA file does not exist or is unreadable',
    );
    restore();
  });
});
