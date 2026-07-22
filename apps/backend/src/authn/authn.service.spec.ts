import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiKeyService } from '../apikeys/apikey.service';
import { ConfigService } from '../config/config.service';
import { UsersService } from '../users/users.service';
import { AuthnService } from './authn.service';

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

const expectUnauthorizedResponse = async (
  validation: Promise<unknown>,
  response: { error: string; message: string; statusCode: number },
) => {
  try {
    await validation;
  } catch (error) {
    expect(error).toBeInstanceOf(UnauthorizedException);
    if (!(error instanceof UnauthorizedException)) {
      throw error;
    }
    expect(error.getResponse()).toEqual(response);
    return;
  }
  throw new Error('Expected validation to reject');
};

const userFixture = (firstName = 'First', lastName = 'Last') => ({
  email: 'user@example.com',
  firstName,
  lastName,
  save: vi.fn(),
});

describe('AuthnService', () => {
  const apiKeyService = {};
  const configService = new ConfigService();
  const jwtService = {};
  const usersService = {
    create: vi.fn(),
    findByEmail: vi.fn(),
    updateLoginMetadata: vi.fn(),
  };
  let authnService: AuthnService;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    configService.set('REGISTRATION_DISABLED', undefined);
    const module = await Test.createTestingModule({
      providers: [
        { provide: ApiKeyService, useValue: apiKeyService },
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
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();
    authnService = module.get(AuthnService);
    vi.spyOn(authnService.logger, 'warn').mockImplementation(
      () => authnService.logger,
    );
  });

  describe('validateOrCreateUser', () => {
    it('formats audit events as raw single-line JSON', () => {
      const message = '{"event":"external_auth.login.rejected_not_provisioned"}';
      const formatted = authnService.logger.format.transform({
        auditEvent: true,
        level: 'warn',
        message,
      });
      if (typeof formatted === 'boolean') {
        throw new TypeError('Expected the logger to format the audit event');
      }

      expect(formatted[Symbol.for('message')]).toBe(message);
    });

    it('logs exactly one five-field audit event when SSO provisioning is denied', async () => {
      configService.set('REGISTRATION_DISABLED', 'sso');
      usersService.findByEmail.mockRejectedValue(new NotFoundException());
      const warn = vi.mocked(authnService.logger.warn);

      const validation = authnService.validateOrCreateUser(
        ' User@Example.com ',
        'SensitiveFirstName',
        'SensitiveLastName',
        'oidc',
      );

      await expectUnauthorizedResponse(validation, NOT_PROVISIONED_RESPONSE);
      expect(warn).toHaveBeenCalledExactlyOnceWith({
        auditEvent: true,
        message: expect.any(String),
      });

      const logEntry = warn.mock.calls[0][0];
      if (!('message' in logEntry) || typeof logEntry.message !== 'string') {
        throw new Error('Expected a serialized audit message');
      }
      const serializedEvent = logEntry.message;
      const auditEvent = JSON.parse(serializedEvent);
      expect(serializedEvent).not.toContain('\n');
      expect(Object.keys(auditEvent)).toEqual([
        'event',
        'provider',
        'email',
        'reason',
        'timestamp',
      ]);
      expect(auditEvent).toEqual({
        email: 'user@example.com',
        event: 'external_auth.login.rejected_not_provisioned',
        provider: 'oidc',
        reason: 'registrationDisabledForSso',
        timestamp: expect.any(String),
      });
      expect(new Date(auditEvent.timestamp).toISOString()).toBe(
        auditEvent.timestamp,
      );
      expect(serializedEvent).not.toContain('SensitiveFirstName');
      expect(serializedEvent).not.toContain('SensitiveLastName');
      expect(serializedEvent).not.toContain('password');
      expect(serializedEvent).not.toContain('token');
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it.each([undefined, 'false', 'local'])(
      'creates a missing SSO user under REGISTRATION_DISABLED=%s',
      async (registrationDisabled) => {
        configService.set('REGISTRATION_DISABLED', registrationDisabled);
        const createdUser = userFixture();
        usersService.findByEmail
          .mockRejectedValueOnce(new NotFoundException())
          .mockResolvedValueOnce(createdUser);

        const result = await authnService.validateOrCreateUser(
          ' Jane.Doe@Agency.gov ',
          'Jane',
          'Doe',
          'oidc',
        );

        expect(result).toBe(createdUser);
        expect(usersService.findByEmail).toHaveBeenNthCalledWith(
          1,
          'jane.doe@agency.gov',
        );
        expect(usersService.findByEmail).toHaveBeenNthCalledWith(
          2,
          'jane.doe@agency.gov',
        );
        const createUser = usersService.create.mock.calls[0][0];
        expect(usersService.create).toHaveBeenCalledExactlyOnceWith({
          creationMethod: 'oidc',
          email: 'jane.doe@agency.gov',
          firstName: 'Jane',
          lastName: 'Doe',
          organization: '',
          password: createUser.password,
          passwordConfirmation: createUser.password,
          role: 'user',
          title: '',
        });
        expect(createUser.password).toBe(createUser.passwordConfirmation);
        expect(createUser.password).toHaveLength(256);
        expect(authnService.logger.warn).not.toHaveBeenCalled();
      },
    );

    it.each(['true', 'sso'])(
      'rejects a missing SSO user under REGISTRATION_DISABLED=%s without creating a user',
      async (registrationDisabled) => {
        configService.set('REGISTRATION_DISABLED', registrationDisabled);
        usersService.findByEmail.mockRejectedValue(new NotFoundException());

        const validation = authnService.validateOrCreateUser(
          ' User@Example.com ',
          'First',
          'Last',
          'oidc',
        );

        await expectUnauthorizedResponse(
          validation,
          NOT_PROVISIONED_RESPONSE,
        );
        expect(usersService.findByEmail).toHaveBeenCalledExactlyOnceWith('user@example.com');
        expect(usersService.create).not.toHaveBeenCalled();
        expect(authnService.logger.warn).toHaveBeenCalledOnce();
      },
    );

    it('propagates non-NotFoundException lookup failures unchanged', async () => {
      const databaseError = new Error('database unavailable');
      usersService.findByEmail.mockRejectedValue(databaseError);
      const registrationAllowed = vi.spyOn(
        configService,
        'isRegistrationAllowed',
      );

      const validation = authnService.validateOrCreateUser(
        'user@example.com',
        'First',
        'Last',
        'oidc',
      );

      await expect(validation).rejects.toBe(databaseError);
      expect(registrationAllowed).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
      expect(authnService.logger.warn).not.toHaveBeenCalled();
    });

    it.each([undefined, '', ' '.repeat(3)])(
      'rejects missing external email %s before lookup',
      async (email) => {
        const validation = authnService.validateOrCreateUser(
          email,
          'First',
          'Last',
          'oidc',
        );

        await expectUnauthorizedResponse(validation, MISSING_EMAIL_RESPONSE);
        expect(usersService.findByEmail).not.toHaveBeenCalled();
        expect(usersService.create).not.toHaveBeenCalled();
        expect(authnService.logger.warn).not.toHaveBeenCalled();
      },
    );

    it.each(['true', 'sso'])(
      'matches a normalized pre-provisioned user under REGISTRATION_DISABLED=%s',
      async (registrationDisabled) => {
        configService.set('REGISTRATION_DISABLED', registrationDisabled);
        const existingUser = userFixture('Jane', 'Doe');
        usersService.findByEmail.mockResolvedValue(existingUser);

        const result = await authnService.validateOrCreateUser(
          ' Jane.Doe@Agency.gov ',
          'Jane',
          'Doe',
          'oidc',
        );

        expect(result).toBe(existingUser);
        expect(usersService.findByEmail).toHaveBeenCalledWith(
          'jane.doe@agency.gov',
        );
        expect(usersService.create).not.toHaveBeenCalled();
        expect(usersService.updateLoginMetadata).toHaveBeenCalledWith(
          existingUser,
        );
      },
    );

    it.each([undefined, 'false', 'true', 'local', 'sso'])(
      'preserves existing-user profile updates under REGISTRATION_DISABLED=%s',
      async (registrationDisabled) => {
        configService.set('REGISTRATION_DISABLED', registrationDisabled);
        const existingUser = userFixture('Old', 'Name');
        usersService.findByEmail.mockResolvedValue(existingUser);
        const registrationAllowed = vi.spyOn(
          configService,
          'isRegistrationAllowed',
        );

        const result = await authnService.validateOrCreateUser(
          'USER@EXAMPLE.COM',
          'New',
          'Name',
          'oidc',
        );

        expect(result).toBe(existingUser);
        expect(existingUser.firstName).toBe('New');
        expect(existingUser.lastName).toBe('Name');
        expect(existingUser.save).toHaveBeenCalledOnce();
        expect(usersService.updateLoginMetadata).toHaveBeenCalledWith(
          existingUser,
        );
        expect(registrationAllowed).not.toHaveBeenCalled();
        expect(usersService.create).not.toHaveBeenCalled();
        expect(authnService.logger.warn).not.toHaveBeenCalled();
      },
    );

    it('does not save an unchanged existing profile', async () => {
      const existingUser = userFixture();
      usersService.findByEmail.mockResolvedValue(existingUser);

      await authnService.validateOrCreateUser(
        'user@example.com',
        'First',
        'Last',
        'oidc',
      );

      expect(existingUser.save).not.toHaveBeenCalled();
      expect(usersService.updateLoginMetadata).toHaveBeenCalledWith(
        existingUser,
      );
    });
  });
});
