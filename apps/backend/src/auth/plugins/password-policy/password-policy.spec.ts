import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {APIError} from 'better-auth/api';
import {passwordPolicy, PASSWORD_POLICY_ERROR_CODES} from './index';
import {createAuth} from '../../auth.config';

vi.mock('@better-auth/core/context', () => ({
  getCurrentAuthContext: vi.fn().mockResolvedValue({path: '/sign-up/email'}),
}));

describe('passwordPolicy plugin', () => {
  describe('plugin object', () => {
    const plugin = passwordPolicy();

    it('has id "password-policy"', () => {
      expect(plugin.id).toBe('password-policy');
    });

    it('has a version string', () => {
      expect(plugin.version).toBeTypeOf('string');
      expect(plugin.version!.length).toBeGreaterThan(0);
    });

    it('exports $ERROR_CODES', () => {
      expect(plugin.$ERROR_CODES).toBe(PASSWORD_POLICY_ERROR_CODES);
    });

    it('has an init function', () => {
      expect(plugin.init).toBeTypeOf('function');
    });
  });

  describe('error codes', () => {
    it('uses defineErrorCodes format with code and message', () => {
      const firstCode = Object.values(PASSWORD_POLICY_ERROR_CODES)[0];
      expect(firstCode).toHaveProperty('code');
      expect(firstCode).toHaveProperty('message');
    });

    it('defines PASSWORD_TOO_SHORT', () => {
      expect(PASSWORD_POLICY_ERROR_CODES.PASSWORD_TOO_SHORT.code).toBe(
        'PASSWORD_TOO_SHORT'
      );
    });

    it('defines MISSING_CHARACTER_CLASS', () => {
      expect(PASSWORD_POLICY_ERROR_CODES.MISSING_CHARACTER_CLASS.code).toBe(
        'MISSING_CHARACTER_CLASS'
      );
    });

    it('defines CONSECUTIVE_CHARACTER_CLASS', () => {
      expect(
        PASSWORD_POLICY_ERROR_CODES.CONSECUTIVE_CHARACTER_CLASS.code
      ).toBe('CONSECUTIVE_CHARACTER_CLASS');
    });
  });

  describe('validatePassword', () => {
    const {validatePassword} = passwordPolicy();

    it('accepts a valid STIG-compliant password', () => {
      expect(() => validatePassword('C0mpl3x!Pass#wd')).not.toThrow();
    });

    it('rejects passwords shorter than 15 characters', () => {
      expect(() => validatePassword('Sh0rt!Pass')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.PASSWORD_TOO_SHORT.message
      );
    });

    it('rejects passwords missing lowercase', () => {
      expect(() => validatePassword('ALLUPP3R!CASEEE')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.MISSING_CHARACTER_CLASS.message
      );
    });

    it('rejects passwords missing uppercase', () => {
      expect(() => validatePassword('alllower3!caseee')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.MISSING_CHARACTER_CLASS.message
      );
    });

    it('rejects passwords missing digits', () => {
      expect(() => validatePassword('NoDigitsHere!@#$')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.MISSING_CHARACTER_CLASS.message
      );
    });

    it('rejects passwords missing special characters', () => {
      expect(() => validatePassword('NoSpecial1Chars2')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.MISSING_CHARACTER_CLASS.message
      );
    });

    it('rejects 4+ consecutive lowercase', () => {
      expect(() => validatePassword('Aaabbb1!ccccDDD')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.CONSECUTIVE_CHARACTER_CLASS.message
      );
    });

    it('rejects 4+ consecutive uppercase', () => {
      expect(() => validatePassword('aaab1!CCCCDDDDD')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.CONSECUTIVE_CHARACTER_CLASS.message
      );
    });

    it('rejects 4+ consecutive digits', () => {
      expect(() => validatePassword('Abc!de1234fGhiJ')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.CONSECUTIVE_CHARACTER_CLASS.message
      );
    });

    it('rejects 4+ consecutive special characters', () => {
      expect(() => validatePassword('Abc1de!@#$fGhiJ')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.CONSECUTIVE_CHARACTER_CLASS.message
      );
    });

    it('rejects 4+ consecutive identical characters', () => {
      expect(() => validatePassword('Abc1!deeeeefGhJ')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.CONSECUTIVE_CHARACTER_CLASS.message
      );
    });

    it('accepts exactly 3 consecutive same-class characters', () => {
      expect(() => validatePassword('Abc1!deeEfG2h#J')).not.toThrow();
    });

    it('accepts custom minLength override', () => {
      const {validatePassword: v} = passwordPolicy({minLength: 20});
      expect(() => v('C0mpl3x!Pa#sWd1')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.PASSWORD_TOO_SHORT.message
      );
      expect(() => v('C0mpl3x!Pa#sWd1Ex!r2')).not.toThrow();
    });

    it('rejects empty password with PASSWORD_TOO_SHORT', () => {
      expect(() => validatePassword('')).toThrow(
        PASSWORD_POLICY_ERROR_CODES.PASSWORD_TOO_SHORT.message
      );
    });

    it('accepts exactly 15-character valid password', () => {
      expect(() => validatePassword('Ab1!cDe2@fGh3#i')).not.toThrow();
    });

    it('throws APIError with BAD_REQUEST status', () => {
      try {
        validatePassword('short');
        expect.unreachable('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(APIError);
        expect((e as APIError).status).toBe('BAD_REQUEST');
      }
    });
  });

  describe('init() integration — wraps ctx.password.hash', () => {
    function getWrappedHash(hashFn: (pw: string) => Promise<string>) {
      const plugin = passwordPolicy();
      const mockCtx = {password: {hash: hashFn, verify: async () => true}} as unknown as Parameters<NonNullable<typeof plugin.init>>[0];
      const result = plugin.init!(mockCtx) as {context: {password: {hash: (pw: string) => Promise<string>}}};
      return result.context.password.hash;
    }

    it('rejects weak password before hashing', async () => {
      const wrappedHash = getWrappedHash(async (pw) => `hashed:${pw}`);
      await expect(wrappedHash('weak')).rejects.toThrow(
        /at least \d+ characters/
      );
    });

    it('returns valid hash for strong password', async () => {
      const wrappedHash = getWrappedHash(async (pw) => `hashed:${pw}`);
      const hash = await wrappedHash('C0mpl3x!Pass#wd');
      expect(hash).toBe('hashed:C0mpl3x!Pass#wd');
    });

    it('does not call original hash when password is rejected', async () => {
      let hashCalled = false;
      const wrappedHash = getWrappedHash(async (pw) => {
        hashCalled = true;
        return `hashed:${pw}`;
      });
      await expect(wrappedHash('weak')).rejects.toThrow();
      expect(hashCalled).toBe(false);
    });
  });

  describe('auth.config.ts integration', () => {
    it('includes password-policy plugin in auth config', () => {
      const auth = createAuth();
      const plugins = auth.options.plugins || [];
      const ppPlugin = plugins.find(
        (p: {id?: string}) => p.id === 'password-policy'
      );
      expect(ppPlugin).toBeDefined();
    });
  });
});
