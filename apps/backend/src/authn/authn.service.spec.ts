import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiKeyService } from '../apikeys/apikey.service';
import type { ConfigService } from '../config/config.service';
import type { User } from '../users/user.model';
import type { UsersService } from '../users/users.service';
import { AuthnService } from './authn.service';

describe('AuthnService.validateOrCreateUser', () => {
  const email: string = 'user@example.com';
  const firstName: string = 'Test';
  const lastName: string = 'User';
  const user = {
    email,
    firstName,
    lastName
  } as User;
  let authnService: AuthnService;
  let configService: { isRegistrationAllowed: ReturnType<typeof vi.fn> };
  let usersService: {
    create: ReturnType<typeof vi.fn>;
    findByEmail: ReturnType<typeof vi.fn>;
    updateLoginMetadata: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    configService = { isRegistrationAllowed: vi.fn() };
    usersService = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      updateLoginMetadata: vi.fn(),
    };
    authnService = new AuthnService(
      {} as ApiKeyService,
      configService as unknown as ConfigService,
      usersService as unknown as UsersService,
      {} as JwtService,
    );
  });

  it('returns an existing external-authentication user regardless of policy', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    configService.isRegistrationAllowed.mockReturnValue(false);

    await expect(
      authnService.validateOrCreateUser(
        email,
        firstName,
        lastName,
        'oidc',
      ),
    ).resolves.toBe(user);
    expect(configService.isRegistrationAllowed).not.toHaveBeenCalled();
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('creates a missing user when SSO registration is allowed', async () => {
    usersService.findByEmail
      .mockRejectedValueOnce(new NotFoundException())
      .mockResolvedValueOnce(user);
    usersService.create.mockResolvedValue(user);
    configService.isRegistrationAllowed.mockReturnValue(true);

    await expect(
      authnService.validateOrCreateUser(
        email,
        firstName,
        lastName,
        'oidc',
      ),
    ).resolves.toBe(user);
    expect(configService.isRegistrationAllowed).toHaveBeenCalledWith('sso');
    expect(usersService.create).toHaveBeenCalledOnce();
  });

  it('rejects a missing user when SSO registration is disabled', async () => {
    usersService.findByEmail.mockRejectedValue(new NotFoundException());
    configService.isRegistrationAllowed.mockReturnValue(false);

    await expect(
      authnService.validateOrCreateUser(
        email,
        firstName,
        lastName,
        'oidc',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('rethrows lookup failures that are not missing-user errors', async () => {
    const error = new Error('database unavailable');
    usersService.findByEmail.mockRejectedValue(error);

    await expect(
      authnService.validateOrCreateUser(
        email,
        firstName,
        lastName,
        'oidc',
      ),
    ).rejects.toBe(error);
    expect(configService.isRegistrationAllowed).not.toHaveBeenCalled();
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('rejects an external identity without an email before lookup', async () => {
    await expect(
      authnService.validateOrCreateUser('', 'Test', 'User', 'oidc'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.findByEmail).not.toHaveBeenCalled();
  });
});
