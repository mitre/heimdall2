import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiKeyService } from '../apikeys/apikey.service';
import { ConfigService } from '../config/config.service';
import { UsersService } from '../users/users.service';
import { AuthnService } from './authn.service';
import { LDAPStrategy } from './ldap.strategy';

const NOT_PROVISIONED_RESPONSE = {
  error: 'account_not_provisioned',
  message:
    'No Heimdall account exists for this SSO user. Please ask your system administrator to create the account.',
  statusCode: 401,
};

const MISSING_EMAIL_RESPONSE = {
  error: 'external_identity_missing_email',
  message: 'External identity did not provide an email address.',
  statusCode: 401,
};

type LDAPVerify = (profile: unknown, done: VerifyDone) => Promise<void>;
type VerifyDone = (error: unknown, user?: unknown) => void;

const ldapVerify = (strategy: LDAPStrategy): LDAPVerify =>
  Reflect.get(strategy, 'verify') as LDAPVerify;

const expectPassportError = (
  done: ReturnType<typeof vi.fn>,
  response: { error: string; message: string; statusCode: number },
) => {
  expect(done).toHaveBeenCalledOnce();
  const [error, user] = done.mock.calls[0];
  expect(error).toBeInstanceOf(UnauthorizedException);
  if (!(error instanceof UnauthorizedException)) {
    throw error;
  }
  expect(error.getResponse()).toEqual(response);
  expect(user).toBeNull();
};

describe('LDAPStrategy', () => {
  const apiKeyService = {};
  const jwtService = {};
  const usersService = {
    create: vi.fn(),
    findByEmail: vi.fn(),
    updateLoginMetadata: vi.fn(),
  };
  let configService: ConfigService;
  let strategy: LDAPStrategy;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    configService = new ConfigService();
    configService.set('LDAP_NAMEFIELD', 'cn');
    configService.set('LDAP_MAILFIELD', 'mail');
    configService.set('LDAP_SSL', 'false');

    const module = await Test.createTestingModule({
      providers: [
        { provide: ApiKeyService, useValue: apiKeyService },
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
        {
          inject: [ApiKeyService, ConfigService, UsersService, JwtService],
          provide: AuthnService,
          useFactory: (
            apiKeys: ApiKeyService,
            config: ConfigService,
            users: UsersService,
            jwt: JwtService,
          ) => new AuthnService(apiKeys, config, users, jwt),
        },
        {
          inject: [AuthnService, ConfigService],
          provide: LDAPStrategy,
          useFactory: (authnService: AuthnService, config: ConfigService) =>
            new LDAPStrategy(authnService, config),
        },
      ],
    }).compile();

    strategy = module.get(LDAPStrategy);
    vi.spyOn(module.get(AuthnService).logger, 'warn').mockImplementation(
      () => module.get(AuthnService).logger,
    );
  });

  it.each(['true', 'sso'])(
    'passes account_not_provisioned to done when a valid LDAP user has no Heimdall account under %s',
    async (registrationDisabled) => {
      configService.set('REGISTRATION_DISABLED', registrationDisabled);
      usersService.findByEmail.mockRejectedValue(new NotFoundException());
      const done = vi.fn();

      await ldapVerify(strategy)(
        { cn: 'Philip Fry', mail: 'fry@example.com' },
        done,
      );

      expectPassportError(done, NOT_PROVISIONED_RESPONSE);
      expect(usersService.findByEmail).toHaveBeenCalledExactlyOnceWith(
        'fry@example.com',
      );
      expect(usersService.create).not.toHaveBeenCalled();
    },
  );

  it('awaits validation and passes the resolved user to done once', async () => {
    const user = {
      email: 'fry@example.com',
      firstName: 'Philip',
      lastName: 'Fry',
      save: vi.fn(),
    };
    usersService.findByEmail.mockResolvedValue(user);
    const done = vi.fn();

    await ldapVerify(strategy)(
      { cn: 'Philip Fry', mail: 'fry@example.com' },
      done,
    );

    expect(done).toHaveBeenCalledExactlyOnceWith(null, user);
  });

  it('uses the first value from a multi-valued mail attribute', async () => {
    const user = {
      email: 'first@example.com',
      firstName: 'Philip',
      lastName: 'Fry',
      save: vi.fn(),
    };
    usersService.findByEmail.mockResolvedValue(user);
    const done = vi.fn();

    await ldapVerify(strategy)(
      {
        cn: 'Philip Fry',
        mail: ['first@example.com', 'second@example.com'],
      },
      done,
    );

    expect(usersService.findByEmail).toHaveBeenCalledExactlyOnceWith(
      'first@example.com',
    );
    expect(done).toHaveBeenCalledExactlyOnceWith(null, user);
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['empty multi-valued', []],
  ])(
    'passes external_identity_missing_email to done for a %s mail attribute',
    async (_description, mail) => {
      const done = vi.fn();

      await ldapVerify(strategy)({ cn: 'Philip Fry', mail }, done);

      expectPassportError(done, MISSING_EMAIL_RESPONSE);
      expect(usersService.findByEmail).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
    },
  );
});
