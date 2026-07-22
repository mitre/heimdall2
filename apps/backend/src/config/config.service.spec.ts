import * as dotenv from 'dotenv';
import mock from 'mock-fs';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  DATABASE_URL_MOCK_ENV,
  ENV_MOCK_FILE,
  SIMPLE_ENV_MOCK_FILE
} from '../../test/constants/env-test.constant';
import {ConfigService} from './config.service';

const withRegistrationDisabled = (value: string | undefined) => {
  const configService = new ConfigService();
  configService.set('REGISTRATION_DISABLED', value);
  return configService;
};

const stubWarningLogger = (configService: ConfigService) => {
  const warn = vi.fn();
  Object.defineProperty(configService, 'logger', { value: { warn } });
  return warn;
};

const registrationMigrationWarning = 'REGISTRATION_DISABLED=true disables SSO/LDAP auto-account creation as well as local registration. New external-authentication users will be rejected until an administrator pre-creates their accounts. Set REGISTRATION_DISABLED=local for the previous behavior (local registration disabled, SSO auto-creation enabled). If pre-provisioned-only access is intended, no action is needed.';
const unverifiedOidcEmailWarning = 'OIDC_USES_VERIFIED_EMAIL=false allows an unverified OIDC email claim to bind to a pre-provisioned Heimdall account when REGISTRATION_DISABLED=true or sso, which can enable account takeover. Set OIDC_USES_VERIFIED_EMAIL=true and require administrator-controlled email claims at the identity provider before using pre-provisioned access.';

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

  describe('Registration policy', () => {
    const originalRegistrationDisabled = process.env.REGISTRATION_DISABLED;

    beforeEach(() => {
      delete process.env.REGISTRATION_DISABLED;
    });

    afterEach(() => {
      if (originalRegistrationDisabled === undefined) {
        delete process.env.REGISTRATION_DISABLED;
      } else {
        process.env.REGISTRATION_DISABLED = originalRegistrationDisabled;
      }
    });

    it('rejects SSO registration when REGISTRATION_DISABLED is sso', () => {
      const configService = withRegistrationDisabled('sso');

      expect(configService.isRegistrationAllowed('sso')).toBe(false);
    });

    it.each([
      [undefined, true, true, true],
      ['false', true, true, true],
      ['FALSE', true, true, true],
      ['true', false, false, false],
      ['TRUE', false, false, false],
      ['local', false, false, true],
      ['LOCAL', false, false, true],
      ['sso', true, true, false],
      ['SSO', true, true, false],
      [' true ', false, false, false],
      [' local ', false, false, true],
      [' sso ', true, true, false],
    ])(
      'maps REGISTRATION_DISABLED=%s across default, local, and SSO scopes',
      (value, defaultAllowed, localAllowed, ssoAllowed) => {
        const configService = withRegistrationDisabled(value);

        expect(configService.isRegistrationAllowed()).toBe(defaultAllowed);
        expect(configService.isRegistrationAllowed('local')).toBe(
          localAllowed,
        );
        expect(configService.isRegistrationAllowed('sso')).toBe(ssoAllowed);
      },
    );

    it.each([
      undefined,
      '',
      ' '.repeat(3),
      'false',
      'FALSE',
      'true',
      'TRUE',
      'local',
      'LOCAL',
      'sso',
      'SSO',
      ' true ',
    ])('accepts REGISTRATION_DISABLED=%s at startup', (value) => {
      const configService = withRegistrationDisabled(value);

      expect(() => configService.validateRegistrationDisabled()).not.toThrow();
    });

    it.each(['1', 'yes', '0', 'banana', 'ture', 'sso-approval'])(
      'rejects invalid REGISTRATION_DISABLED=%s at startup',
      (value) => {
        const configService = withRegistrationDisabled(value);

        expect(() => configService.validateRegistrationDisabled()).toThrowError(
          new Error(
            `Invalid REGISTRATION_DISABLED value "${value}". Valid values: false, true, local, sso (case-insensitive).`,
          ),
        );
      },
    );

    describe('Startup policy warnings', () => {
      it('warns once when REGISTRATION_DISABLED is true and OAuth is the only enabled external strategy', () => {
        const configService = withRegistrationDisabled('true');
        configService.set('OIDC_CLIENTID', 'oidc-client-id');
        configService.set('OIDC_CLIENT_SECRET', 'must-not-be-logged');
        const warn = stubWarningLogger(configService);

        configService.validateRegistrationDisabled();

        expect(configService.enabledOauthStrategies()).toEqual(['oidc']);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(registrationMigrationWarning);
      });

      it('warns once when REGISTRATION_DISABLED is true and LDAP is the only enabled external strategy', () => {
        const configService = withRegistrationDisabled('true');
        configService.set('LDAP_ENABLED', 'true');
        const warn = stubWarningLogger(configService);

        configService.validateRegistrationDisabled();

        expect(configService.enabledOauthStrategies()).toEqual([]);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(registrationMigrationWarning);
      });

      it.each<[string, string | undefined, boolean]>([
        ['true with no external strategy', 'true', false],
        ['unset with OAuth', undefined, true],
        ['false with OAuth', 'false', true],
        ['local with OAuth', 'local', true],
        ['sso with OAuth', 'sso', true],
      ])(
        'does not emit the migration warning for %s',
        (_name, registrationDisabled, oauthEnabled) => {
          const configService = withRegistrationDisabled(registrationDisabled);
          if (oauthEnabled) {
            configService.set('OIDC_CLIENTID', 'oidc-client-id');
          }
          const warn = stubWarningLogger(configService);

          configService.validateRegistrationDisabled();

          expect(warn).not.toHaveBeenCalled();
        },
      );

      it('does not repeat startup warnings during ordinary registration-policy reads', () => {
        const configService = withRegistrationDisabled('true');
        configService.set('LDAP_ENABLED', 'true');
        const warn = stubWarningLogger(configService);

        configService.validateRegistrationDisabled();
        expect(configService.isRegistrationAllowed()).toBe(false);
        expect(configService.isRegistrationAllowed('local')).toBe(false);
        expect(configService.isRegistrationAllowed('sso')).toBe(false);

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(registrationMigrationWarning);
      });

      it.each<[string, number]>([
        ['true', 2],
        ['sso', 1],
      ])(
        'warns about unverified OIDC email matching under REGISTRATION_DISABLED=%s',
        (registrationDisabled, warningCount) => {
          const configService = withRegistrationDisabled(registrationDisabled);
          configService.set('OIDC_CLIENTID', 'oidc-client-id');
          configService.set('OIDC_USES_VERIFIED_EMAIL', 'false');
          const warn = stubWarningLogger(configService);

          configService.validateRegistrationDisabled();

          expect(warn).toHaveBeenCalledTimes(warningCount);
          expect(warn).toHaveBeenCalledWith(unverifiedOidcEmailWarning);
        },
      );

      it.each([
        [undefined, 'false'],
        ['false', 'false'],
        ['local', 'false'],
        ['true', undefined],
        ['true', 'true'],
        ['true', 'FALSE'],
        ['sso', undefined],
        ['sso', 'true'],
        ['sso', 'FALSE'],
      ])(
        'does not emit the unverified-email warning for REGISTRATION_DISABLED=%s and OIDC_USES_VERIFIED_EMAIL=%s',
        (registrationDisabled, oidcUsesVerifiedEmail) => {
          const configService = withRegistrationDisabled(
            registrationDisabled,
          );
          configService.set(
            'OIDC_USES_VERIFIED_EMAIL',
            oidcUsesVerifiedEmail,
          );
          const warn = stubWarningLogger(configService);

          configService.validateRegistrationDisabled();

          expect(warn).not.toHaveBeenCalled();
        },
      );
    });

    it.each([
      [undefined, true],
      ['false', true],
      ['true', false],
      ['local', false],
      ['sso', true],
    ])(
      'maps REGISTRATION_DISABLED=%s to registrationEnabled=%s',
      (value, registrationEnabled) => {
        const configService = withRegistrationDisabled(value);

        expect(
          configService.frontendStartupSettings().registrationEnabled,
        ).toBe(registrationEnabled);
      },
    );
  });
});

describe('Backend bootstrap', () => {
  afterEach(() => {
    vi.doUnmock('@nestjs/core');
    vi.doUnmock('../app.module');
    vi.doUnmock('../token/token.providers');
    vi.resetModules();
  });

  it('validates REGISTRATION_DISABLED exactly once before listening', async () => {
    const validateRegistrationDisabled = vi.fn();
    const listen = vi.fn().mockResolvedValue(undefined);
    const configService = {
      enabledOauthStrategies: vi.fn().mockReturnValue([]),
      get: vi.fn().mockReturnValue(undefined),
      getSplunkHostUrl: vi.fn().mockReturnValue(''),
      getTenableHostUrl: vi.fn().mockReturnValue(''),
      isInProductionMode: vi.fn().mockReturnValue(false),
      validateRegistrationDisabled,
    };
    const app = {
      enableShutdownHooks: vi.fn(),
      get: vi.fn().mockReturnValue(configService),
      listen,
      set: vi.fn(),
      use: vi.fn(),
      useGlobalPipes: vi.fn(),
    };

    vi.doMock('@nestjs/core', () => ({ NestFactory: { create: vi.fn().mockResolvedValue(app) } }));
    vi.doMock('../app.module', () => ({ AppModule: class AppModule {} }));
    vi.doMock('../token/token.providers', () => ({ generateDefault: vi.fn() }));

    await import('../main.js');
    await vi.waitFor(() => expect(listen).toHaveBeenCalledOnce());

    expect(validateRegistrationDisabled).toHaveBeenCalledOnce();
    expect(validateRegistrationDisabled.mock.invocationCallOrder[0]).toBeLessThan(
      listen.mock.invocationCallOrder[0],
    );
  });
});
