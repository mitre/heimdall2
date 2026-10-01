import {ExecutionContext, ForbiddenException} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ConfigService} from '../config/config.service';
import {LDAPAuthGuard} from './ldap-auth.guard';

vi.mock('fs', () => ({readFileSync: () => ''}));

describe('LDAPAuthGuard', () => {
  const context = {} as ExecutionContext;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  function createGuard(value: string | undefined): LDAPAuthGuard {
    vi.stubEnv('DATABASE_URL', undefined);
    vi.stubEnv('LDAP_ENABLED', value);
    return new LDAPAuthGuard(new ConfigService());
  }

  it.each([undefined, '', 'false', 'FALSE', '1', 'yes', ' true '])(
    'blocks LDAP before Passport when LDAP_ENABLED=%s',
    (value) => {
      const authenticate = vi
        .spyOn(AuthGuard('ldap').prototype, 'canActivate')
        .mockResolvedValue(true);

      expect(() => createGuard(value).canActivate(context)).toThrow(
        ForbiddenException
      );
      expect(authenticate).not.toHaveBeenCalled();
    }
  );

  it.each(['true', 'TRUE', 'TrUe'])(
    'runs LDAP authentication when LDAP_ENABLED=%s',
    async (value) => {
      const authenticate = vi
        .spyOn(AuthGuard('ldap').prototype, 'canActivate')
        .mockResolvedValue(true);

      await expect(createGuard(value).canActivate(context)).resolves.toBe(true);
      expect(authenticate).toHaveBeenCalledExactlyOnceWith(context);
    }
  );

  it('preserves an authentication rejection when LDAP is enabled', async () => {
    vi.spyOn(AuthGuard('ldap').prototype, 'canActivate').mockResolvedValue(false);

    await expect(createGuard('true').canActivate(context)).resolves.toBe(false);
  });
});
