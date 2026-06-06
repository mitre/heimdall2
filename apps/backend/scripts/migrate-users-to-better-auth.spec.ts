import {readFileSync} from 'fs';
import {resolve} from 'path';
import {describe, expect, beforeAll, afterAll} from 'vitest';
import {ba_user, ba_account} from '../src/db/auth-schema.generated';
import {migrateUsers, userIdMapping} from './migrate-users-to-better-auth';
import {test} from '../src/db/test-fixture';
import type {TestDb} from '../src/db/test-fixture';
import {createTestPool} from '../src/db/test-utils';
import {and, eq, sql} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/node-postgres';
import {legacyUserFactory} from '../src/db/factories';

let emailCounter = 0;

function uniqueEmail(prefix: string): string {
  emailCounter += 1;
  return `${prefix}-${Date.now()}-${emailCounter}@migrate.test`;
}

async function createLegacyUser(
  db: TestDb,
  overrides: Parameters<typeof legacyUserFactory.create>[1] = {},
) {
  return legacyUserFactory.create(db, {
    email: uniqueEmail('legacy'),
    firstName: 'Test',
    lastName: 'User',
    encryptedPassword: '$2b$14$hashedpassword',
    role: 'user',
    creationMethod: 'local',
    loginCount: 0,
    ...overrides,
  });
}

async function selectMigratedUser(db: TestDb, email: string) {
  return db.select().from(ba_user).where(eq(ba_user.email, email));
}

async function selectAccountsForUser(db: TestDb, userId: string) {
  return db.select().from(ba_account).where(eq(ba_account.userId, userId));
}

async function selectMappingsForOldId(db: TestDb, oldId: string) {
  return db
    .select()
    .from(userIdMapping)
    .where(eq(userIdMapping.oldId, oldId));
}

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
    const legacyUser = await createLegacyUser(db, {
      email: uniqueEmail('fresh'),
      firstName: 'Fresh',
    });

    await migrateUsers(db);
    const firstUsers = await selectMigratedUser(db, legacyUser.email);
    expect(firstUsers).toHaveLength(1);

    const firstMappings = await selectMappingsForOldId(db, String(legacyUser.id));
    expect(firstMappings).toEqual([
      {oldId: String(legacyUser.id), newId: firstUsers[0].id},
    ]);

    const secondRun = await migrateUsers(db);
    const secondUsers = await selectMigratedUser(db, legacyUser.email);
    const secondMappings = await selectMappingsForOldId(db, String(legacyUser.id));
    const secondAccounts = await selectAccountsForUser(db, firstUsers[0].id);

    expect(secondRun.skipped).toBeGreaterThanOrEqual(1);
    expect(secondUsers).toHaveLength(1);
    expect(secondMappings).toHaveLength(1);
    expect(secondAccounts).toHaveLength(1);
  });

  test('migrates a local user with correct fields and password in account', async ({db}) => {
    const legacyUser = await createLegacyUser(db, {
      email: uniqueEmail('local'),
      firstName: 'Test',
      lastName: 'User',
      organization: 'MITRE',
      title: 'Engineer',
      encryptedPassword: '$2b$14$hashedpassword',
      role: 'admin',
      creationMethod: 'local',
      loginCount: 5,
    });

    await migrateUsers(db);

    const users = await selectMigratedUser(db, legacyUser.email);
    expect(users).toHaveLength(1);
    const [migrated] = users;
    expect(migrated.firstName).toBe('Test');
    expect(migrated.lastName).toBe('User');
    expect(migrated.organization).toBe('MITRE');
    expect(migrated.role).toBe('admin');
    expect(migrated.creationMethod).toBe('local');
    expect(migrated.loginCount).toBe(5);
    expect(migrated.name).toBe('Test User');

    const accounts = await selectAccountsForUser(db, migrated.id);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].providerId).toBe('credential');
    expect(accounts[0].password).toBe('$2b$14$hashedpassword');

    const mapping = await selectMappingsForOldId(db, String(legacyUser.id));
    expect(mapping).toEqual([{oldId: String(legacyUser.id), newId: migrated.id}]);
  });

  test('migrates an OAuth user with correct providerId and no password', async ({db}) => {
    const legacyUser = await createLegacyUser(db, {
      email: uniqueEmail('github'),
      firstName: 'Git',
      lastName: 'Hub',
      encryptedPassword: '$2b$14$randomhash',
      role: 'user',
      creationMethod: 'github',
    });

    await migrateUsers(db);

    const users = await selectMigratedUser(db, legacyUser.email);
    expect(users).toHaveLength(1);
    const accounts = await selectAccountsForUser(db, users[0].id);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].providerId).toBe('github');
    expect(accounts[0].password).toBeNull();
  });

  test('migrates LDAP user as credential provider with password', async ({db}) => {
    const legacyUser = await createLegacyUser(db, {
      email: uniqueEmail('ldap'),
      firstName: 'Ldap',
      lastName: 'User',
      encryptedPassword: '$2b$14$ldaphash',
      role: 'user',
      creationMethod: 'ldap',
    });

    await migrateUsers(db);

    const users = await selectMigratedUser(db, legacyUser.email);
    expect(users).toHaveLength(1);
    const accounts = await selectAccountsForUser(db, users[0].id);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].providerId).toBe('credential');
    expect(accounts[0].password).toBe('$2b$14$ldaphash');
  });

  test('is idempotent — running twice does not duplicate users', async ({db}) => {
    const legacyUser = await createLegacyUser(db, {
      email: uniqueEmail('repeat'),
      firstName: 'Re',
      lastName: 'Peat',
      encryptedPassword: '$2b$14$hash',
      role: 'user',
      creationMethod: 'local',
    });

    await migrateUsers(db);
    const firstUsers = await selectMigratedUser(db, legacyUser.email);
    expect(firstUsers).toHaveLength(1);
    const firstAccounts = await selectAccountsForUser(db, firstUsers[0].id);
    expect(firstAccounts).toHaveLength(1);
    const firstMappings = await selectMappingsForOldId(db, String(legacyUser.id));
    expect(firstMappings).toHaveLength(1);

    const secondRun = await migrateUsers(db);
    expect(secondRun.skipped).toBeGreaterThanOrEqual(1);

    const secondUsers = await selectMigratedUser(db, legacyUser.email);
    const secondAccounts = await selectAccountsForUser(db, firstUsers[0].id);
    const secondMappings = await selectMappingsForOldId(db, String(legacyUser.id));
    expect(secondUsers).toEqual(firstUsers);
    expect(secondAccounts).toEqual(firstAccounts);
    expect(secondMappings).toEqual(firstMappings);
  });
});
