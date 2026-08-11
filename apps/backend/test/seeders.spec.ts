import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

type Seeder = { up: (queryInterface: FakeQueryInterface) => Promise<unknown> };

// The seeder is CommonJS (sequelize-cli owns it), lives OUTSIDE the TS project,
// and requires '../dist/src/crypto/password' — so `yarn backend build` must
// have run (the Verification command does exactly that before test:ci). It is
// loaded via a runtime dynamic import (not a static ESM import of an
// out-of-project .js) and held on an object so the assignment is a property
// write, not a top-level rebind. `seeder()` reads it back.
const SEEDER_PATH = '../seeders/20200514154327-create-administrator.js';
const loaded: { module?: Seeder } = {};

beforeAll(async () => {
  loaded.module = (await import(SEEDER_PATH)) as Seeder;
});

type FakeQueryInterface = {
  bulkInsert: ReturnType<typeof vi.fn>;
  sequelize: {
    query: ReturnType<typeof vi.fn>;
    QueryTypes: { SELECT: string };
  };
};

type InsertedAdmin = {
  creationMethod: string;
  email: string;
  encryptedPassword: string;
  forcePasswordChange: boolean;
  role: string;
};

// A queryInterface whose admin-count query returns `adminCount`, capturing any
// bulkInsert so the seeded row can be inspected. `counts` feeds the §12
// write-gate derivation queries the seeder runs (site 8): total Users and
// HashMigrationMarkers rows — both default to '0', the fresh-install shape.
function fakeQueryInterface(
  adminCount: string,
  counts: { markers?: string; users?: string } = {},
): FakeQueryInterface {
  const bulkInsert = vi.fn().mockResolvedValue(undefined);
  const query = vi.fn().mockImplementation((sql: string) => {
    if (sql.includes('HashMigrationMarkers')) {
      return Promise.resolve([{ count: counts.markers ?? '0' }]);
    }
    if (sql.includes('COUNT') && sql.includes("role = 'admin'")) {
      return Promise.resolve([{ count: adminCount }]);
    }
    if (sql.includes('COUNT')) {
      return Promise.resolve([{ count: counts.users ?? '0' }]);
    }
    return Promise.resolve([{ result: 2 }]);
  });
  return { bulkInsert, sequelize: { query, QueryTypes: { SELECT: 'SELECT' } } };
}

function insertedAdmin(qi: FakeQueryInterface): InsertedAdmin {
  return qi.bulkInsert.mock.calls[0][1][0] as InsertedAdmin;
}

function seeder(): Seeder {
  if (loaded.module === undefined) {
    throw new Error('seeder module not loaded');
  }
  return loaded.module;
}

// §9 validation message, shared by the gate service and the seeder's
// compiled decision function.
const ENV_VALIDATION_MESSAGE = /PASSWORD_HASH_WRITE_ENABLED must be 'true' or 'false'/v;

function markerInserts(qi: FakeQueryInterface): number {
  return qi.bulkInsert.mock.calls.filter(
    (call: unknown[]) => call[0] === 'HashMigrationMarkers',
  ).length;
}

describe('administrator bootstrap seeder (site 8)', () => {
  // vi.stubEnv layers over process.env without manual bracket mutation; each
  // test that needs a value stubs it, and unstub restores everything. The
  // seeder merges process.env last, so a stub takes effect. (.env-ci sets no
  // ADMIN_* keys, so the unset-default tests are clean without pre-clearing.)
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('stores an encryptedPassword with the $pbkdf2-sha512$ prefix on a clean DB', async () => {
    const qi = fakeQueryInterface('0');
    await seeder().up(qi);
    expect(insertedAdmin(qi).encryptedPassword.startsWith('$pbkdf2-sha512$')).toBe(
      true,
    );
  });

  it('awaits the hash — the stored value is a resolved string, not a Promise', async () => {
    const qi = fakeQueryInterface('0');
    await seeder().up(qi);
    const stored = insertedAdmin(qi).encryptedPassword;
    expect(typeof stored).toBe('string');
    expect(stored).not.toContain('[object Promise]');
  });

  it('is idempotent — inserts nothing when an administrator already exists', async () => {
    const qi = fakeQueryInterface('1');
    await seeder().up(qi);
    expect(qi.bulkInsert).not.toHaveBeenCalled();
  });

  it('defaults to local creationMethod when ADMIN_USES_EXTERNAL_AUTH is unset', async () => {
    const qi = fakeQueryInterface('0');
    await seeder().up(qi);
    expect(insertedAdmin(qi).creationMethod).toBe('local');
  });

  it('honors ADMIN_USES_EXTERNAL_AUTH=true — creationMethod ldap, still a real hash', async () => {
    vi.stubEnv('ADMIN_USES_EXTERNAL_AUTH', 'true');
    const qi = fakeQueryInterface('0');
    await seeder().up(qi);
    const admin = insertedAdmin(qi);
    expect(admin.creationMethod).toBe('ldap');
    // The placeholder password is still PBKDF2-hashed (never bcrypt).
    expect(admin.encryptedPassword.startsWith('$pbkdf2-sha512$')).toBe(true);
  });

  it('uses ADMIN_EMAIL when provided, and forces a password change', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'boss@example.mil');
    const qi = fakeQueryInterface('0');
    await seeder().up(qi);
    const admin = insertedAdmin(qi);
    expect(admin.email).toBe('boss@example.mil');
    expect(admin.role).toBe('admin');
    expect(admin.forcePasswordChange).toBe(true);
  });

  // ADR-006 §12: site 8 is in the write gate's scope. The DECISION is the
  // same compiled pure function the Nest gate uses (hash-write-decision.js);
  // the seeder supplies the DB probes and — because cmd.sh runs it BEFORE the
  // app's first boot — plants the durable marker when its own write is the
  // first PBKDF2 write, so the app's later derivation stays enabled (sticky).
  describe('§12 write gate (site 8)', () => {
    it('upgrade shape — existing users, no marker, env unset → bcrypt fallback readable by pre-N pods, and NO marker planted', async () => {
      vi.stubEnv('PASSWORD_HASH_WRITE_ENABLED', '');
      const qi = fakeQueryInterface('0', { markers: '0', users: '5' });
      await seeder().up(qi);
      expect(insertedAdmin(qi).encryptedPassword.startsWith('$2b$14$')).toBe(
        true,
      );
      expect(markerInserts(qi)).toBe(0);
    });

    it('marker present — PBKDF2 writes already began, so the admin hashes PBKDF2 even with existing users (no duplicate marker)', async () => {
      vi.stubEnv('PASSWORD_HASH_WRITE_ENABLED', '');
      const qi = fakeQueryInterface('0', { markers: '1', users: '5' });
      await seeder().up(qi);
      expect(
        insertedAdmin(qi).encryptedPassword.startsWith('$pbkdf2-sha512$'),
      ).toBe(true);
      expect(markerInserts(qi)).toBe(0);
    });

    it('fresh install — the seeder performs the first PBKDF2 write and PLANTS the §12 marker', async () => {
      vi.stubEnv('PASSWORD_HASH_WRITE_ENABLED', '');
      const qi = fakeQueryInterface('0', { markers: '0', users: '0' });
      await seeder().up(qi);
      expect(
        insertedAdmin(qi).encryptedPassword.startsWith('$pbkdf2-sha512$'),
      ).toBe(true);
      expect(markerInserts(qi)).toBe(1);
      const markerCall = qi.bulkInsert.mock.calls.find(
        (call: unknown[]) => call[0] === 'HashMigrationMarkers',
      ) as [string, { markerVersion: number }[]];
      expect(markerCall[1][0].markerVersion).toBe(1);
    });

    it('explicit PASSWORD_HASH_WRITE_ENABLED=false wins — bcrypt even on an otherwise fresh DB', async () => {
      vi.stubEnv('PASSWORD_HASH_WRITE_ENABLED', 'false');
      const qi = fakeQueryInterface('0');
      await seeder().up(qi);
      expect(insertedAdmin(qi).encryptedPassword.startsWith('$2b$14$')).toBe(
        true,
      );
      expect(markerInserts(qi)).toBe(0);
    });

    it('an invalid PASSWORD_HASH_WRITE_ENABLED throws (§9: never clamp silently) — same rule as the gate service', async () => {
      vi.stubEnv('PASSWORD_HASH_WRITE_ENABLED', 'yes');
      const qi = fakeQueryInterface('0');
      await expect(seeder().up(qi)).rejects.toThrow(ENV_VALIDATION_MESSAGE);
    });
  });
});
