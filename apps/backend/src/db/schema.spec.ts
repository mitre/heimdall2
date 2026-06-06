import {describe, expect, it} from 'vitest';
import {getTableName, getTableColumns} from 'drizzle-orm';
import {users, evaluations, evaluationTags, groups, groupUsers, groupEvaluations, apiKeys} from './schema';
import {createInsertSchema, createSelectSchema} from 'drizzle-zod';

describe('introspected Drizzle schema', () => {
  describe('table names match existing PostgreSQL tables', () => {
    it('Users table', () => expect(getTableName(users)).toBe('Users'));
    it('Evaluations table', () => expect(getTableName(evaluations)).toBe('Evaluations'));
    it('EvaluationTags table', () => expect(getTableName(evaluationTags)).toBe('EvaluationTags'));
    it('Groups table', () => expect(getTableName(groups)).toBe('Groups'));
    it('GroupUsers table', () => expect(getTableName(groupUsers)).toBe('GroupUsers'));
    it('GroupEvaluations table', () => expect(getTableName(groupEvaluations)).toBe('GroupEvaluations'));
    it('ApiKeys table', () => expect(getTableName(apiKeys)).toBe('ApiKeys'));
  });

  describe('Users columns match existing schema', () => {
    it('has all required columns', () => {
      const cols = getTableColumns(users);
      expect(cols.id.name).toBe('id');
      expect(cols.email.name).toBe('email');
      expect(cols.firstName.name).toBe('firstName');
      expect(cols.lastName.name).toBe('lastName');
      expect(cols.organization.name).toBe('organization');
      expect(cols.encryptedPassword.name).toBe('encryptedPassword');
      expect(cols.role.name).toBe('role');
      expect(cols.creationMethod.name).toBe('creationMethod');
      expect(cols.forcePasswordChange.name).toBe('forcePasswordChange');
      expect(cols.loginCount.name).toBe('loginCount');
      expect(cols.lastLogin.name).toBe('lastLogin');
      expect(cols.passwordChangedAt.name).toBe('passwordChangedAt');
    });

    it('role has a default value', () => {
      const cols = getTableColumns(users);
      expect(cols.role.hasDefault).toBe(true);
    });
  });

  describe('Evaluations columns', () => {
    it('has required columns', () => {
      const cols = getTableColumns(evaluations);
      expect(cols.id.name).toBe('id');
      expect(cols.filename.name).toBe('filename');
      expect(cols.data.name).toBe('data');
      expect(cols.public.name).toBe('public');
      expect(cols.userId.name).toBe('userId');
    });
  });

  describe('Groups columns', () => {
    it('has name with uniqueness', () => {
      const cols = getTableColumns(groups);
      expect(cols.name.name).toBe('name');
      expect(cols.desc.name).toBe('desc');
    });
  });

  describe('PK columns use mode: number (not bigint)', () => {
    it('Users.id infers as number, not BigInt', () => {
      const cols = getTableColumns(users);
      expect(cols.id.columnType).toBe('PgBigSerial53');
    });

    it('all 7 tables use PgBigSerial53 for PKs', () => {
      const tables = [users, evaluations, evaluationTags, groups, groupUsers, groupEvaluations, apiKeys];
      for (const table of tables) {
        const cols = getTableColumns(table);
        expect(cols.id.columnType).toBe('PgBigSerial53');
      }
    });
  });

  describe('drizzle-zod generates valid Zod schemas', () => {
    it('creates insert schema for users', () => {
      const schema = createInsertSchema(users);
      expect(schema.parse).toBeTypeOf('function');
    });

    it('creates select schema for users', () => {
      const schema = createSelectSchema(users);
      expect(schema.parse).toBeTypeOf('function');
    });

    it('insert schema requires email and encryptedPassword', () => {
      const schema = createInsertSchema(users);
      const missing = schema.safeParse({});
      expect(missing.success).toBe(false);
      const valid = schema.safeParse({
        email: 'test@example.com',
        encryptedPassword: 'hashed',
        creationMethod: 'local',
        loginCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      expect(valid.success).toBe(true);
    });

    it('generates schemas for all 7 tables without error', () => {
      const tables = [users, evaluations, evaluationTags, groups, groupUsers, groupEvaluations, apiKeys];
      for (const table of tables) {
        expect(() => createInsertSchema(table)).not.toThrow();
        expect(() => createSelectSchema(table)).not.toThrow();
      }
    });
  });
});
