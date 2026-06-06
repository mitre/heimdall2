import {describe, it, expect} from 'vitest';
import env from '../../env';
import {CreateUserSchema} from './create-user.schema';
import {UpdateUserSchema} from './update-user.schema';
import {DeleteUserSchema} from './delete-user.schema';

describe('Users Zod Schemas', () => {
  describe('CreateUserSchema', () => {
    it('accepts valid create user input', () => {
      const result = CreateUserSchema.safeParse({
        email: 'test@example.com',
        password: 'LETmeiN123$$$tP',
        passwordConfirmation: 'LETmeiN123$$$tP',
        firstName: 'Test',
        lastName: 'User',
        title: 'Engineer',
        organization: 'MITRE',
        role: 'user',
        creationMethod: 'local',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = CreateUserSchema.safeParse({
        email: 'not-an-email',
        password: 'LETmeiN123$$$tP',
        passwordConfirmation: 'LETmeiN123$$$tP',
        role: 'user',
        creationMethod: 'local',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing email', () => {
      const result = CreateUserSchema.safeParse({
        password: 'LETmeiN123$$$tP',
        passwordConfirmation: 'LETmeiN123$$$tP',
        role: 'user',
        creationMethod: 'local',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing password', () => {
      const result = CreateUserSchema.safeParse({
        email: 'test@example.com',
        passwordConfirmation: 'LETmeiN123$$$tP',
        role: 'user',
        creationMethod: 'local',
      });
      expect(result.success).toBe(false);
    });

    it(`rejects password shorter than configured minimum (${env.PASSWORD_MIN_LENGTH})`, () => {
      const shortPassword = 'a'.repeat(env.PASSWORD_MIN_LENGTH - 1);
      const result = CreateUserSchema.safeParse({
        email: 'test@example.com',
        password: shortPassword,
        passwordConfirmation: shortPassword,
        role: 'user',
        creationMethod: 'local',
      });
      expect(result.success).toBe(false);
    });

    it(`accepts password at exactly configured minimum (${env.PASSWORD_MIN_LENGTH})`, () => {
      const exactPassword = 'a'.repeat(env.PASSWORD_MIN_LENGTH);
      const result = CreateUserSchema.safeParse({
        email: 'test@example.com',
        password: exactPassword,
        passwordConfirmation: exactPassword,
        role: 'user',
        creationMethod: 'local',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid role', () => {
      const result = CreateUserSchema.safeParse({
        email: 'test@example.com',
        password: 'LETmeiN123$$$tP',
        passwordConfirmation: 'LETmeiN123$$$tP',
        role: 'superadmin',
        creationMethod: 'local',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid creationMethod', () => {
      const result = CreateUserSchema.safeParse({
        email: 'test@example.com',
        password: 'LETmeiN123$$$tP',
        passwordConfirmation: 'LETmeiN123$$$tP',
        role: 'user',
        creationMethod: 'smoke-signals',
      });
      expect(result.success).toBe(false);
    });

    it('allows optional fields to be omitted', () => {
      const result = CreateUserSchema.safeParse({
        email: 'test@example.com',
        password: 'LETmeiN123$$$tP',
        passwordConfirmation: 'LETmeiN123$$$tP',
        role: 'user',
        creationMethod: 'local',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateUserSchema', () => {
    it('accepts valid update with all fields', () => {
      const result = UpdateUserSchema.safeParse({
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        organization: 'New Org',
        title: 'New Title',
        role: 'user',
        password: 'NEWpass789!@#xY',
        passwordConfirmation: 'NEWpass789!@#xY',
        forcePasswordChange: false,
        currentPassword: 'OLDpass123$$$tP',
      });
      expect(result.success).toBe(true);
    });

    it('accepts partial update with only currentPassword', () => {
      const result = UpdateUserSchema.safeParse({
        currentPassword: 'x',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = UpdateUserSchema.safeParse({
        email: 'not-valid',
        currentPassword: 'OLDpass123$$$tP',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid role value', () => {
      const result = UpdateUserSchema.safeParse({
        role: 'superadmin',
        currentPassword: 'OLDpass123$$$tP',
      });
      expect(result.success).toBe(false);
    });

    it(`rejects new password shorter than configured minimum (${env.PASSWORD_MIN_LENGTH})`, () => {
      const shortPassword = 'a'.repeat(env.PASSWORD_MIN_LENGTH - 1);
      const result = UpdateUserSchema.safeParse({
        password: shortPassword,
        passwordConfirmation: shortPassword,
        currentPassword: 'OLDpass123$$$tP',
      });
      expect(result.success).toBe(false);
    });

    it('accepts currentPassword of any length (existing password verification)', () => {
      const result = UpdateUserSchema.safeParse({
        currentPassword: 'x',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('DeleteUserSchema', () => {
    it('accepts password field (existing password for verification)', () => {
      const result = DeleteUserSchema.safeParse({
        password: 'LETmeiN123$$$tP',
      });
      expect(result.success).toBe(true);
    });

    it('accepts short existing password (pre-STIG accounts)', () => {
      const result = DeleteUserSchema.safeParse({
        password: 'oldpass8',
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty object (admin delete without password)', () => {
      const result = DeleteUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects empty string password', () => {
      const result = DeleteUserSchema.safeParse({
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('env.PASSWORD_MIN_LENGTH configuration', () => {
    it('defaults to STIG-compliant 15 characters', () => {
      expect(env.PASSWORD_MIN_LENGTH).toBe(15);
    });
  });
});
