import {randomUUID} from 'node:crypto';
import bcrypt from 'bcryptjs';
import {ba_user, ba_account} from '../auth-schema.generated';
import {passwordPolicy} from '../../auth/plugins/password-policy';
import env from '../../env';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

type BaUserInsert = typeof ba_user.$inferInsert;
type BaUserSelect = typeof ba_user.$inferSelect;

export interface CreateUserOptions extends Partial<BaUserInsert> {
  password?: string;
}

const {validatePassword} = passwordPolicy();

let counter = 0;

export const userFactory = {
  build(overrides?: Partial<BaUserInsert>): BaUserInsert {
    counter++;
    return {
      id: randomUUID(),
      name: `Test User ${counter}`,
      email: `test-${counter}-${randomUUID().slice(0, 8)}@test.heimdall.local`,
      emailVerified: true,
      role: 'user',
      creationMethod: 'local',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  async create(
    db: NodePgDatabase<Record<string, unknown>>,
    options?: CreateUserOptions
  ): Promise<BaUserSelect> {
    const {password, ...userOverrides} = options ?? {};
    const data = userFactory.build(userOverrides);

    if (password) {
      validatePassword(password);
    }

    return db.transaction(async (tx) => {
      const [user] = await tx.insert(ba_user).values(data).returning();

      if (password) {
        const hashed = await bcrypt.hash(password, env.BCRYPT_COST);
        await tx.insert(ba_account).values({
          id: randomUUID(),
          userId: user.id,
          providerId: 'credential',
          accountId: user.id,
          password: hashed,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return user;
    });
  },
};
