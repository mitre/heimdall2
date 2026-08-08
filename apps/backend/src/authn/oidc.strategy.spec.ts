import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiKeyService } from '../apikeys/apikey.service';
import { ConfigService } from '../config/config.service';
import { GroupsService } from '../groups/groups.service';
import { UsersService } from '../users/users.service';
import { AuthnService } from './authn.service';
import { OidcStrategy } from './oidc.strategy';

const NOT_PROVISIONED_RESPONSE = {
  error: 'account_not_provisioned',
  message:
    'No Heimdall account exists for this SSO user. Please ask your system administrator to create the account.',
  statusCode: 401,
};

type OIDCProfile = {
  _json: {
    email: string;
    email_verified: boolean;
    family_name: string;
    given_name: string;
    groups: string[];
  };
  _raw: string;
  displayName: string;
  emails: [{ value: string }];
  id: string;
  name: { familyName: string; givenName: string };
};

type OIDCVerify = (
  issuer: string,
  uiProfile: OIDCProfile,
  idProfile: object,
  context: object,
  idToken: string,
  accessToken: string,
  refreshToken: string,
  parameters: object,
  done: VerifyDone,
) => Promise<void>;
type VerifyDone = (error: unknown, user?: unknown) => void;

const oidcVerify = (strategy: OidcStrategy): OIDCVerify =>
  Reflect.get(strategy, '_verify') as OIDCVerify;

const profile = (): OIDCProfile => ({
  _json: {
    email: 'fry@example.com',
    email_verified: true,
    family_name: 'Fry',
    given_name: 'Philip',
    groups: [],
  },
  _raw: '{}',
  displayName: 'Philip Fry',
  emails: [{ value: 'fry@example.com' }],
  id: 'fry',
  name: { familyName: 'Fry', givenName: 'Philip' },
});

const verifyProfile = async (
  strategy: OidcStrategy,
  done: VerifyDone,
): Promise<void> => {
  await oidcVerify(strategy)(
    'https://issuer.example',
    profile(),
    {},
    {},
    'id-token',
    'access-token',
    'refresh-token',
    {},
    done,
  );
};

describe('OidcStrategy', () => {
  const apiKeyService = {};
  const groupsService = { syncUserGroups: vi.fn() };
  const jwtService = {};
  const usersService = {
    create: vi.fn(),
    findByEmail: vi.fn(),
    updateLoginMetadata: vi.fn(),
  };
  let configService: ConfigService;
  let strategy: OidcStrategy;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    configService = new ConfigService();

    const module = await Test.createTestingModule({
      providers: [
        { provide: ApiKeyService, useValue: apiKeyService },
        { provide: ConfigService, useValue: configService },
        { provide: GroupsService, useValue: groupsService },
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
          inject: [AuthnService, ConfigService, GroupsService],
          provide: OidcStrategy,
          useFactory: (
            authnService: AuthnService,
            config: ConfigService,
            groups: GroupsService,
          ) => new OidcStrategy(authnService, config, groups),
        },
      ],
    }).compile();

    strategy = module.get(OidcStrategy);
    vi.spyOn(module.get(AuthnService).logger, 'warn').mockImplementation(
      () => module.get(AuthnService).logger,
    );
    vi.spyOn(strategy.logger, 'debug').mockImplementation(
      () => strategy.logger,
    );
  });

  it.each(['true', 'sso'])(
    'passes account_not_provisioned to done when a valid OIDC user has no Heimdall account under %s',
    async (registrationDisabled) => {
      configService.set('REGISTRATION_DISABLED', registrationDisabled);
      usersService.findByEmail.mockRejectedValue(new NotFoundException());
      const done = vi.fn();

      await verifyProfile(strategy, done);

      expect(done).toHaveBeenCalledOnce();
      const [error, user] = done.mock.calls[0];
      expect(error).toBeInstanceOf(UnauthorizedException);
      if (!(error instanceof UnauthorizedException)) {
        throw error;
      }
      expect(error.getResponse()).toEqual(NOT_PROVISIONED_RESPONSE);
      expect(user).toBeNull();
      expect(usersService.findByEmail).toHaveBeenCalledExactlyOnceWith(
        'fry@example.com',
      );
      expect(usersService.create).not.toHaveBeenCalled();
    },
  );

  it('registers the nine-argument verifier needed to receive the raw OIDC profile', () => {
    expect(oidcVerify(strategy)).toHaveLength(9);
  });

  it('passes a resolved existing user to done once', async () => {
    const user = {
      email: 'fry@example.com',
      firstName: 'Philip',
      lastName: 'Fry',
      save: vi.fn(),
    };
    usersService.findByEmail.mockResolvedValue(user);
    const done = vi.fn();

    await verifyProfile(strategy, done);

    expect(done).toHaveBeenCalledExactlyOnceWith(null, user);
    expect(usersService.create).not.toHaveBeenCalled();
  });
});
