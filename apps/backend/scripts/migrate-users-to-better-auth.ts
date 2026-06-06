import {randomUUID} from 'crypto';
import {eq} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/node-postgres';
import {ba_user, ba_account} from '../src/db/auth-schema.generated';
import {users as legacyUsers} from '../src/db/legacy-schema';
import {userIdMapping} from '../src/db/migration-schema';
import {getDrizzleConnectionConfig} from '../src/db/connection';

const CREDENTIAL_PROVIDERS = new Set(['local', 'ldap']);

export {userIdMapping} from '../src/db/migration-schema';

export async function migrateUsers(
  db: ReturnType<typeof drizzle>
): Promise<{migrated: number; skipped: number}> {

  const existingUsers = await db.select().from(legacyUsers);

  let migrated = 0;
  let skipped = 0;

  for (const user of existingUsers) {
    const oldId = String(user.id);

    const existing = await db
      .select()
      .from(userIdMapping)
      .where(eq(userIdMapping.oldId, oldId));

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const newId = randomUUID();
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

    const creationMethod = user.creationMethod || 'local';
    const isCredentialProvider = CREDENTIAL_PROVIDERS.has(creationMethod);

    await db.transaction(async (tx) => {
      await tx.insert(ba_user).values({
        id: newId,
        name,
        email: user.email,
        emailVerified: true,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        role: user.role || 'user',
        firstName: user.firstName,
        lastName: user.lastName,
        organization: user.organization,
        title: user.title,
        creationMethod,
        forcePasswordChange: user.forcePasswordChange || false,
        loginCount: user.loginCount || 0,
        lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
        passwordChangedAt: user.passwordChangedAt
          ? new Date(user.passwordChangedAt)
          : null,
      });

      await tx.insert(ba_account).values({
        id: randomUUID(),
        accountId: newId,
        providerId: isCredentialProvider ? 'credential' : creationMethod,
        userId: newId,
        password: isCredentialProvider ? user.encryptedPassword : null,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      });

      await tx.insert(userIdMapping).values({
        oldId,
        newId,
      });
    });

    migrated++;
  }

  return {migrated, skipped};
}
