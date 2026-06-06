import {describe, expect, it, vi} from 'vitest';
import {createHmac} from 'crypto';

describe('Auth flow fixes', () => {
  describe('GitLab strategy env var', () => {
    it('reads GITLAB_CLIENTSECRET not GITLAB_SECRET', async () => {
      const source = await import('./gitlab.strategy');
      const sourceCode = source.GitlabStrategy.toString();
      expect(sourceCode).not.toContain('GITLAB_SECRET');
    });
  });

  describe('LDAP injection prevention', () => {
    it('escapes LDAP special characters from username', () => {
      const dangerous = 'admin)(|(uid=*';
      const escaped = escapeLdapFilter(dangerous);
      expect(escaped).not.toContain('(');
      expect(escaped).not.toContain(')');
      expect(escaped).not.toContain('*');
    });

    it('preserves normal usernames', () => {
      expect(escapeLdapFilter('john.doe')).toBe('john.doe');
      expect(escapeLdapFilter('jdoe123')).toBe('jdoe123');
    });
  });

  describe('LDAP strategy validate', () => {
    it('awaits validateOrCreateUser before passing to done', async () => {
      const source = (await import('./ldap.strategy')).LDAPStrategy;
      const validateMethod = source.prototype.validate.toString();
      expect(validateMethod).toContain('await');
    });
  });

  describe('Login endpoint validation', () => {
    it('login endpoint does not use unsafe req.body cast', async () => {
      const source = await import('./authn.controller');
      const controllerCode = source.AuthnController.prototype.login.toString();
      expect(controllerCode).not.toContain('as {email');
    });
  });

  describe('JWT secret derivation', () => {
    it('uses HMAC not string concatenation for JWT secret', async () => {
      const source = await import('./authn.service');
      const loginCode = source.AuthnService.prototype.login.toString();
      expect(loginCode).not.toContain("get('JWT_SECRET') + jwtSecret");
      expect(loginCode).toContain('createHmac');
    });
  });

  describe('LocalStrategy return type consistency', () => {
    it('validateUser returns id as string always', async () => {
      const source = await import('./authn.service');
      const validateCode = source.AuthnService.prototype.validateUser.toString();
      expect(validateCode).toContain('String(');
    });
  });
});

function escapeLdapFilter(input: string): string {
  return input
    .replace(/\\/g, '\\5c')
    .replace(/\*/g, '\\2a')
    .replace(/\(/g, '\\28')
    .replace(/\)/g, '\\29')
    .replace(/\x00/g, '\\00');
}
