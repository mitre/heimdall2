import {describe, expect, afterAll} from 'vitest';
import {sql} from 'drizzle-orm';
import {users} from './schema';
import {test} from './test-fixture';
import {createTestPool} from './test-utils';

describe('test-fixture transaction rollback', () => {
  const verifyPool = createTestPool();

  afterAll(async () => {
    await verifyPool.end();
  });

  test('inserts data visible within the test transaction', async ({db}) => {
    const now = new Date().toISOString();
    const [inserted] = await db
      .insert(users)
      .values({
        email: 'rollback-proof@fixture.test',
        encryptedPassword: 'x',
        role: 'user',
        creationMethod: 'local',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    expect(inserted.email).toBe('rollback-proof@fixture.test');
    expect(inserted.id).toBeTypeOf('number');

    const found = await db.select().from(users).where(sql`email = 'rollback-proof@fixture.test'`);
    expect(found).toHaveLength(1);
  });

  test('previous test data was rolled back — not visible in a new transaction', async ({db}) => {
    const found = await db.select().from(users).where(sql`email = 'rollback-proof@fixture.test'`);
    expect(found).toHaveLength(0);
  });

  test('data is also not visible via a separate connection outside the fixture', async ({db}) => {
    const now = new Date().toISOString();
    await db.insert(users).values({
      email: 'external-check@fixture.test',
      encryptedPassword: 'x',
      role: 'user',
      creationMethod: 'local',
      createdAt: now,
      updatedAt: now,
    });

    const result = await verifyPool.query(
      `SELECT count(*) FROM "Users" WHERE email = 'external-check@fixture.test'`,
    );
    expect(Number(result.rows[0].count)).toBe(0);
  });
});
