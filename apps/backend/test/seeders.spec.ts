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
// bulkInsert so the seeded row can be inspected.
function fakeQueryInterface(adminCount: string): FakeQueryInterface {
  const bulkInsert = vi.fn().mockResolvedValue(undefined);
  const query = vi.fn().mockImplementation((sql: string) => {
    if (sql.includes('COUNT')) {
      return Promise.resolve([{ count: adminCount }]);
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
});
