import {readFileSync} from 'fs';
import {resolve} from 'path';
import {describe, expect, beforeAll, afterAll} from 'vitest';
import {ba_user, ba_account} from '../src/db/auth-schema.generated';
import {users as legacyUsers} from '../src/db/legacy-schema';
import {migrateUsers, userIdMapping} from './migrate-users-to-better-auth';
import {test} from '../src/db/test-fixture';
import {createTestPool} from '../src/db/test-utils';
import {sql} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/node-postgres';

describe('migrate-users-to-better-auth', () => {
  const setupPool = createTestPool();

  beforeAll(async () => {
    const setupDb = drizzle(setupPool);
    const migrationSql = readFileSync(
      resolve(__dirname, '../migrations/0001_create_user_id_mapping.sql'),
      'utf-8',
    );
    await setupDb.execute(sql.raw(migrationSql));
  });

  afterAll(async () => {
    await setupPool.end();
  });

  test('migrates only users not already in ba_user', async ({db}) => {
    const before = await migrateUsers(db);
    const initialMigrated = before.migrated;

    await db.insert(legacyUsers).values({
      email: 'fresh@migrate.test',
      firstName: 'Fresh',
      lastName: 'User',
      encryptedPassword: '$2b$14$hash',
      role: 'user',
      creationMethod: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const after = await migrateUsers(db);
    expect(after.migrated).toBeGreaterThanOrEqual(1);
    expect(after.skipped).toBeGreaterThanOrEqual(initialMigrated);
  });

  test('migrates a local user with correct fields and password in account', async ({db}) => {
    await db.insert(legacyUsers).values({
      email: 'test@migrate.test',
      firstName: 'Test',
      lastName: 'User',
      organization: 'MITRE',
      title: 'Engineer',
      encryptedPassword: '$2b$14$hashedpassword',
      role: 'admin',
      creationMethod: 'local',
      loginCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = await migrateUsers(db);
    expect(result.migrated).toBeGreaterThanOrEqual(1);

    const users = await db.select().from(ba_user);
    expect(users.length).toBeGreaterThanOrEqual(1);
    const migrated = users.find((u) => u.email === 'test@migrate.test');
    expect(migrated).toBeDefined();
    expect(migrated!.firstName).toBe('Test');
    expect(migrated!.lastName).toBe('User');
    expect(migrated!.organization).toBe('MITRE');
    expect(migrated!.role).toBe('admin');
    expect(migrated!.creationMethod).toBe('local');
    expect(migrated!.loginCount).toBe(5);
    expect(migrated!.name).toBe('Test User');

    const accounts = await db.select().from(ba_account);
    const account = accounts.find((a) => a.userId === migrated!.id);
    expect(account).toBeDefined();
    expect(account!.providerId).toBe('credential');
    expect(account!.password).toBe('$2b$14$hashedpassword');

    const mapping = await db.select().from(userIdMapping);
    const mapped = mapping.find((m) => m.newId === migrated!.id);
    expect(mapped).toBeDefined();
  });

  test('migrates an OAuth user with correct providerId and no password', async ({db}) => {
    await db.insert(legacyUsers).values({
      email: 'github@migrate.test',
      firstName: 'Git',
      lastName: 'Hub',
      encryptedPassword: '$2b$14$randomhash',
      role: 'user',
      creationMethod: 'github',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = await migrateUsers(db);
    expect(result.migrated).toBeGreaterThanOrEqual(1);

    const accounts = await db.select().from(ba_account);
    const account = accounts.find((a) => {
      const user = db.select().from(ba_user);
      return true;
    });
    const allAccounts = accounts.filter((a) => a.providerId === 'github');
    expect(allAccounts.length).toBeGreaterThanOrEqual(1);
    expect(allAccounts[0].password).toBeNull();
  });

  test('migrates LDAP user as credential provider with password', async ({db}) => {
    await db.insert(legacyUsers).values({
      email: 'ldap@migrate.test',
      firstName: 'Ldap',
      lastName: 'User',
      encryptedPassword: '$2b$14$ldaphash',
      role: 'user',
      creationMethod: 'ldap',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = await migrateUsers(db);
    expect(result.migrated).toBeGreaterThanOrEqual(1);

    const users = await db.select().from(ba_user);
    const migrated = users.find((u) => u.email === 'ldap@migrate.test');
    const accounts = await db.select().from(ba_account);
    const account = accounts.find((a) => a.userId === migrated!.id);
    expect(account!.providerId).toBe('credential');
    expect(account!.password).toBe('$2b$14$ldaphash');
  });

  test('is idempotent — running twice does not duplicate users', async ({db}) => {
    await db.insert(legacyUsers).values({
      email: 'repeat@migrate.test',
      firstName: 'Re',
      lastName: 'Peat',
      encryptedPassword: '$2b$14$hash',
      role: 'user',
      creationMethod: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const firstRun = await migrateUsers(db);
    const firstMigrated = firstRun.migrated;
    expect(firstMigrated).toBeGreaterThanOrEqual(1);

    const secondRun = await migrateUsers(db);
    expect(secondRun.migrated).toBe(0);
    expect(secondRun.skipped).toBeGreaterThanOrEqual(firstRun.migrated + firstRun.skipped);

    const users = await db.select().from(ba_user);
    const matching = users.filter((u) => u.email === 'repeat@migrate.test');
    expect(matching.length).toBe(1);
  });
});
