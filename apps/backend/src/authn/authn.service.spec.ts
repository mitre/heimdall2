import { JwtService } from '@nestjs/jwt';
import { decode, type JwtPayload } from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import type { ApiKeyService } from '../apikeys/apikey.service';
import type { ConfigService } from '../config/config.service';
import type { UsersService } from '../users/users.service';
import { AuthnService } from './authn.service';

function service(adminExpiry?: string) {
  const config = {
    get: (key: string) => {
      if (key === 'ADMIN_JWT_EXPIRE_TIME') {
        return adminExpiry;
      }
      if (key === 'JWT_SECRET') {
        return 'test-secret';
      }
    },
  } as unknown as ConfigService;
  const users = { findById: () => Promise.resolve({ jwtSecret: 'user-secret' }) } as unknown as UsersService;
  return new AuthnService(
    {} as ApiKeyService,
    config,
    users,
    new JwtService({}),
  );
}

describe('AuthnService login expiry', () => {
  it.each([
    [undefined, 'admin', false, 600],
    ['60m', 'admin', false, 3600],
    ['60m', 'user', true, 600],
    ['3d', 'admin', false, 172_800],
  ])('signs %s for %s with password change %s', async (setting, role, forcePasswordChange, seconds) => {
    const { accessToken } = await service(setting).login({
      email: 'user@example.test',
      forcePasswordChange,
      id: 'user-1',
      role,
    });
    const payload = decode(accessToken) as JwtPayload;
    expect(payload.exp! - payload.iat!).toBe(seconds);
  });

  it('rejects an invalid admin duration', async () => {
    await expect(
      service('invalid').login({
        email: 'user@example.test',
        forcePasswordChange: false,
        id: 'user-1',
        role: 'admin',
      }),
    ).rejects.toThrow();
  });
});
