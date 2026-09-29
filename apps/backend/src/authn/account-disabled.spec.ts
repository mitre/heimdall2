import {UnauthorizedException} from '@nestjs/common';
import {describe, expect, it, vi} from 'vitest';
import {AuthnService} from './authn.service';
import {JwtStrategy} from './jwt.strategy';
import {User} from '../users/user.model';
import {UsersService} from '../users/users.service';
import {ConfigService} from '../config/config.service';
import {ApiKeyService} from '../apikeys/apikey.service';
import {JwtService} from '@nestjs/jwt';
import {hash} from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {Group} from '../groups/group.model';

describe('disabled account authentication', () => {
  const user = {id: '1', email: 'disabled@example.com', isDisabled: true} as User;
  const users = {
    findByEmail: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user)
  } as unknown as UsersService;
  const config = {get: vi.fn().mockReturnValue('test-secret')} as unknown as ConfigService;
  const authn = new AuthnService(
    {} as ApiKeyService,
    config,
    users,
    {sign: vi.fn()} as unknown as JwtService
  );

  it('rejects local and external login', async () => {
    expect(await authn.validateUser(user.email, 'password')).toBeNull();
    await expect(
      authn.validateOrCreateUser(user.email, 'Disabled', 'User', 'oidc')
    ).rejects.toThrow(UnauthorizedException);
    await expect(authn.login(user)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an existing JWT session', async () => {
    const strategy = new JwtStrategy(config, users);
    await expect(
      strategy.validate({sub: user.id, email: user.email, role: 'user'})
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects user API keys while leaving group keys usable', async () => {
    const key = jwt.sign({keyId: '1'}, 'test-secret');
    const apiKey = await hash(key.split('.')[2], 4);
    const record = {apiKey, type: 'user', user};
    const apiKeys = {findById: vi.fn().mockResolvedValue(record)};
    const service = new AuthnService(
      apiKeys as unknown as ApiKeyService,
      config,
      users,
      {} as JwtService
    );

    expect(await service.validateApiKey(key)).toBeNull();
    const group = {id: '2'} as Group;
    apiKeys.findById.mockResolvedValue({apiKey, type: 'group', group});
    expect(await service.validateApiKey(key)).toBe(group);
  });
});
