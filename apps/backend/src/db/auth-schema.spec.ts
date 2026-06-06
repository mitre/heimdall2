import {describe, expect, it} from 'vitest';
import {getTableName, getTableColumns} from 'drizzle-orm';
import {
  ba_user,
  ba_session,
  ba_account,
  ba_verification,
} from './auth-schema.generated';

describe('auth-schema (generated)', () => {
  describe('ba_user table', () => {
    it('is named ba_user in SQL', () => {
      expect(getTableName(ba_user)).toBe('ba_user');
    });

    it('has all better-auth core columns with correct SQL names', () => {
      const cols = getTableColumns(ba_user);
      expect(cols.id.name).toBe('id');
      expect(cols.name.name).toBe('name');
      expect(cols.email.name).toBe('email');
      expect(cols.emailVerified.name).toBe('email_verified');
      expect(cols.image.name).toBe('image');
      expect(cols.createdAt.name).toBe('created_at');
      expect(cols.updatedAt.name).toBe('updated_at');
    });

    it('has admin plugin columns with correct SQL names', () => {
      const cols = getTableColumns(ba_user);
      expect(cols.role.name).toBe('role');
      expect(cols.banned.name).toBe('banned');
      expect(cols.banReason.name).toBe('ban_reason');
      expect(cols.banExpires.name).toBe('ban_expires');
    });

    it('has all Heimdall custom fields with correct SQL names', () => {
      const cols = getTableColumns(ba_user);
      expect(cols.firstName.name).toBe('first_name');
      expect(cols.lastName.name).toBe('last_name');
      expect(cols.organization.name).toBe('organization');
      expect(cols.title.name).toBe('title');
      expect(cols.creationMethod.name).toBe('creation_method');
      expect(cols.forcePasswordChange.name).toBe('force_password_change');
      expect(cols.loginCount.name).toBe('login_count');
      expect(cols.lastLogin.name).toBe('last_login');
      expect(cols.passwordChangedAt.name).toBe('password_changed_at');
    });

    it('has email uniqueness constraint', () => {
      const cols = getTableColumns(ba_user);
      expect(cols.email.isUnique).toBe(true);
    });
  });

  describe('ba_session table', () => {
    it('is named ba_session in SQL', () => {
      expect(getTableName(ba_session)).toBe('ba_session');
    });

    it('has all required columns with correct SQL names', () => {
      const cols = getTableColumns(ba_session);
      expect(cols.id.name).toBe('id');
      expect(cols.token.name).toBe('token');
      expect(cols.userId.name).toBe('user_id');
      expect(cols.expiresAt.name).toBe('expires_at');
      expect(cols.ipAddress.name).toBe('ip_address');
      expect(cols.userAgent.name).toBe('user_agent');
      expect(cols.impersonatedBy.name).toBe('impersonated_by');
    });

    it('has token uniqueness constraint', () => {
      const cols = getTableColumns(ba_session);
      expect(cols.token.isUnique).toBe(true);
    });

    it('has userId as not-null', () => {
      const cols = getTableColumns(ba_session);
      expect(cols.userId.notNull).toBe(true);
    });
  });

  describe('ba_account table', () => {
    it('is named ba_account in SQL', () => {
      expect(getTableName(ba_account)).toBe('ba_account');
    });

    it('has all required columns with correct SQL names', () => {
      const cols = getTableColumns(ba_account);
      expect(cols.id.name).toBe('id');
      expect(cols.providerId.name).toBe('provider_id');
      expect(cols.accountId.name).toBe('account_id');
      expect(cols.userId.name).toBe('user_id');
      expect(cols.password.name).toBe('password');
      expect(cols.accessToken.name).toBe('access_token');
      expect(cols.refreshToken.name).toBe('refresh_token');
    });

    it('has userId as not-null', () => {
      const cols = getTableColumns(ba_account);
      expect(cols.userId.notNull).toBe(true);
    });
  });

  describe('ba_verification table', () => {
    it('is named ba_verification in SQL', () => {
      expect(getTableName(ba_verification)).toBe('ba_verification');
    });

    it('has all required columns with correct SQL names', () => {
      const cols = getTableColumns(ba_verification);
      expect(cols.id.name).toBe('id');
      expect(cols.identifier.name).toBe('identifier');
      expect(cols.value.name).toBe('value');
      expect(cols.expiresAt.name).toBe('expires_at');
    });
  });

  describe('table name prefixing', () => {
    it('all tables use ba_ prefix to avoid collision with Sequelize tables', () => {
      expect(getTableName(ba_user)).toMatch(/^ba_/);
      expect(getTableName(ba_session)).toMatch(/^ba_/);
      expect(getTableName(ba_account)).toMatch(/^ba_/);
      expect(getTableName(ba_verification)).toMatch(/^ba_/);
    });
  });
});
