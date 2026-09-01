import * as dotenv from 'dotenv';
import mock from 'mock-fs';
import {
  AUTH_STRATEGIES,
  AUTH_STRATEGY,
  OAUTH_AUTH_STRATEGIES,
} from '@heimdall/common/interfaces';
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
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

  describe('Authentication strategies', () => {
    const authEnvironmentKeys = [
      'GITHUB_CLIENTID',
      'GITLAB_CLIENTID',
      'GOOGLE_CLIENTID',
      'OKTA_CLIENTID',
      'OIDC_CLIENTID',
      'LDAP_ENABLED',
      'LOCAL_LOGIN_DISABLED',
      'SAML_NAME',
      'SAML_ENTRY_POINT',
      'SAML_ISSUER',
      'SAML_IDP_CERT',
      'TENABLE_HOST_URL',
    ] as const;
    let authEnvironment: Record<string, string | undefined>;

    beforeEach(() => {
      authEnvironment = Object.fromEntries(
        authEnvironmentKeys.map(key => [key, process.env[key]]),
      );
      for (const key of authEnvironmentKeys) {
        delete process.env[key];
      }
    });

    afterEach(() => {
      for (const key of authEnvironmentKeys) {
        const value = authEnvironment[key];
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    });

    it('separates OAuth callbacks from LDAP and SAML authentication', () => {
      const configService = new ConfigService();
      configService.set('LOCAL_LOGIN_DISABLED', 'true');
      configService.set('LDAP_ENABLED', 'true');
      configService.set('OIDC_CLIENTID', 'client-id');
      configService.set('SAML_NAME', 'MockSAML');
      configService.set(
        'SAML_ENTRY_POINT',
        'http://localhost:4000/api/saml/sso',
      );
      configService.set('SAML_ISSUER', 'heimdall-local');
      configService.set('SAML_IDP_CERT', 'certificate');
      expect(configService.enabledAuthStrategies()).toEqual([
        'ldap',
        'oidc',
        'saml',
      ]);
      expect(configService.enabledOauthStrategies()).toEqual(['oidc']);
    });

    it('requires a SAML name', () => {
      const configService = new ConfigService();
      configService.set('LOCAL_LOGIN_DISABLED', 'true');
      configService.set(
        'SAML_ENTRY_POINT',
        'http://localhost:4000/api/saml/sso',
      );
      configService.set('SAML_ISSUER', 'heimdall-local');
      configService.set('SAML_IDP_CERT', 'certificate');

      expect(configService.enabledAuthStrategies()).not.toContain(
        AUTH_STRATEGY.SAML,
      );
    });

    it('exposes the configured SAML provider name', () => {
      const configService = new ConfigService();
      configService.set('SAML_NAME', 'Agency SSO');

      expect(configService.frontendStartupSettings().samlName).toBe(
        'Agency SSO',
      );
    });

    it('limits OAuth callbacks to OAuth client strategies', () => {
      const configService = new ConfigService();
      configService.set('LDAP_ENABLED', 'true');
      configService.set('OIDC_CLIENTID', 'client-id');
      configService.set('SAML_NAME', 'MockSAML');
      configService.set(
        'SAML_ENTRY_POINT',
        'http://localhost:4000/api/saml/sso',
      );
      configService.set('SAML_ISSUER', 'heimdall-local');
      configService.set('SAML_IDP_CERT', 'certificate');

      const enabledOauthStrategies = configService.enabledOauthStrategies();
      expect(enabledOauthStrategies).toContain(AUTH_STRATEGY.OIDC);
      expect(enabledOauthStrategies).not.toContain(AUTH_STRATEGY.LDAP);
      expect(enabledOauthStrategies).not.toContain(AUTH_STRATEGY.SAML);
    });

    it('keeps auth strategy data internally consistent', () => {
      for (const [key, value] of Object.entries(AUTH_STRATEGY)) {
        expect(value).toBe(key.toLowerCase());
      }
      expect(
        OAUTH_AUTH_STRATEGIES.every(authStrategy =>
          AUTH_STRATEGIES.includes(authStrategy),
        ),
      ).toBe(true);
    });
  });
});
