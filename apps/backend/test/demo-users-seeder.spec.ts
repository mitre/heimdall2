import { validatePasswordBoolean } from '@heimdall/password-complexity';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

// The seeder is CommonJS (sequelize-cli owns it), lives OUTSIDE the TS project,
// and requires '../dist/src/crypto/password' — so `yarn backend build` must have
// run first (the Verification command does exactly that before test:ci). Loaded
// via a runtime dynamic import held on an object, so the assignment is a
// property write rather than a top-level rebind — the same pattern
// seeders.spec.ts established for the administrator seeder.
const SEEDER_PATH = '../seeders/20260815000000-create-demo-users.js';
// Held in a variable for the same reason as SEEDER_PATH: a literal specifier
// into build output cannot be statically resolved by eslint-plugin-n.
const CRYPTO_PATH = '../dist/src/crypto/password.js';

/** The PHC prefix a PBKDF2-SHA512 hash must carry (crypto/password.ts §1-2). */
const PBKDF2_SHA512 = /^\$pbkdf2-sha512\$i=\d+\$/;

const byText = (a: string, b: string): number => a.localeCompare(b);

/**
 * SEED_PASSWORD override fixture. Another shift/unshift column walk, so it
 * satisfies the app's own policy — the previous fixture did not, which a
 * reviewer measured. A card about seeding policy-valid credentials should not
 * use a credential the product would refuse; the assertion below keeps it
 * from drifting back.
 */
const OVERRIDE_PASSWORD = '2wsx3edc@WSX#EDC';

type FakeQueryInterface = {
  bulkDelete: ReturnType<typeof vi.fn>;
  bulkInsert: ReturnType<typeof vi.fn>;
  sequelize: {
    QueryTypes: { SELECT: string };
    query: ReturnType<typeof vi.fn>;
  };
};

type SeededUser = {
  createdAt: Date;
  creationMethod: string;
  email: string;
  encryptedPassword: string;
  firstName: string;
  forcePasswordChange: boolean;
  role: string;
};

type Seeder = {
  DEMO_EMAILS: string[];
  DEMO_PASSWORD: string;
  down: (queryInterface: FakeQueryInterface) => Promise<unknown>;
  up: (queryInterface: FakeQueryInterface) => Promise<unknown>;
};

const loaded: { module?: Seeder } = {};

beforeAll(async () => {
  loaded.module = (await import(SEEDER_PATH)) as Seeder;
});

function seeder(): Seeder {
  const module_ = loaded.module;
  if (!module_) {
    throw new Error('seeder module was not loaded');
  }
  return module_;
}

/**
 * A queryInterface whose existing-user probe returns `existingEmails`, so
 * idempotency can be driven without a database.
 */
function fakeQueryInterface(existingEmails: string[] = []): FakeQueryInterface {
  return {
    bulkDelete: vi.fn().mockResolvedValue(undefined),
    bulkInsert: vi.fn().mockResolvedValue(undefined),
    sequelize: {
      QueryTypes: { SELECT: 'SELECT' },
      query: vi
        .fn()
        .mockResolvedValue(existingEmails.map((email) => ({ email }))),
    },
  };
}

/** Rows handed to bulkInsert, flattened across calls. */
function insertedUsers(queryInterface: FakeQueryInterface): SeededUser[] {
  return queryInterface.bulkInsert.mock.calls.flatMap(
    (call) => call[1] as SeededUser[],
  );
}

beforeEach(() => {
  // The KDF enforces a floor of 100000 iterations, so this is the cheapest
  // LEGAL setting — not a weakened parameter, just the bottom of the allowed
  // range, and it keeps a spec that hashes on most tests from paying the
  // 600000-iteration production default each time.
  vi.stubEnv('PASSWORD_HASH_ITERATIONS', '100000');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('demo user seeder — production guard', () => {
  it('no-ops when NODE_ENV is production and SEED_DEMO_DATA is unset', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SEED_DEMO_DATA', '');
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    // packaging/rpm/cmd.sh runs `db:seed:all` on EVERY container start, so this
    // is the card's entire safety property. Asserting that the guard code
    // exists would prove nothing — assert that no insert happens.
    expect(queryInterface.bulkInsert).not.toHaveBeenCalled();
  });

  it('seeds in development with no environment variable set', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SEED_DEMO_DATA', '');
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    expect(queryInterface.bulkInsert).toHaveBeenCalled();
  });

  it('seeds in test with no environment variable set', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SEED_DEMO_DATA', '');
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    expect(queryInterface.bulkInsert).toHaveBeenCalled();
  });

  it('seeds in production when SEED_DEMO_DATA opts in explicitly', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SEED_DEMO_DATA', 'true');
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    // Vulcan's two-concern pattern: an operator can still demo deliberately.
    expect(queryInterface.bulkInsert).toHaveBeenCalled();
  });
});

describe('demo user seeder — roster', () => {
  it('seeds exactly the four documented accounts with their roles', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    const byEmail = new Map(
      insertedUsers(queryInterface).map((user) => [user.email, user]),
    );
    expect([...byEmail.keys()].toSorted(byText)).toEqual([
      'admin@example.com',
      'api-admin@example.com',
      'api-user@example.com',
      'user@example.com',
    ]);
    // Users.role is the APP-WIDE concept (admin|user). GroupUsers.role
    // (owner|member) is a different column entirely and belongs to sked.2.
    expect(byEmail.get('admin@example.com')?.role).toBe('admin');
    expect(byEmail.get('user@example.com')?.role).toBe('user');
    expect(byEmail.get('api-admin@example.com')?.role).toBe('admin');
    expect(byEmail.get('api-user@example.com')?.role).toBe('user');
  });

  it('hashes through the FIPS-approved PBKDF2 path, not bcrypt', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    // Assert the POSITIVE format. `not.toMatch(/bcrypt/)` would pass against
    // scrypt, pbkdf2 and plaintext alike, which is how a vacuous hash
    // assertion shipped once already.
    for (const user of insertedUsers(queryInterface)) {
      expect(user.encryptedPassword).toMatch(PBKDF2_SHA512);
    }
  });

  it('never forces a password change — the login loop must not be interrupted', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    // These accounts exist for a fast, repeatable login loop. The
    // administrator seeder sets forcePasswordChange true on purpose; doing the
    // same here would make every demo login land on a change-password screen.
    // Added because a mutation flipping this flag was detected by nothing.
    for (const user of insertedUsers(queryInterface)) {
      expect(user.forcePasswordChange).toBe(false);
    }
  });

  it('uses a default password this app would actually accept', () => {
    // A seeded password the app rejects is a broken seed. Checked against the
    // real policy module rather than eyeballed against PASSWORD_MIN_LENGTH.
    expect(validatePasswordBoolean(seeder().DEMO_PASSWORD)).toBe(true);
  });

  it('honours SEED_PASSWORD when set', async () => {
    // The override fixture must itself be a credential this app would accept,
    // or the test quietly models something the product forbids.
    expect(validatePasswordBoolean(OVERRIDE_PASSWORD)).toBe(true);
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SEED_PASSWORD', OVERRIDE_PASSWORD);
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    // Distinct hashes per run make a direct comparison impossible, so assert
    // the override reached the hasher by verifying against it.
    const { verifyPassword } = (await import(CRYPTO_PATH)) as {
      verifyPassword: (arguments_: {
        hash: string;
        password: string;
      }) => Promise<{ needsRehash: boolean; valid: boolean }>;
    };
    const seeded = insertedUsers(queryInterface)[0];
    // verifyPassword resolves {needsRehash, valid} — not a bare boolean.
    await expect(
      verifyPassword({
        hash: seeded.encryptedPassword,
        password: OVERRIDE_PASSWORD,
      }),
    ).resolves.toMatchObject({ valid: true });
  });
});

describe('demo user seeder — idempotency', () => {
  it('inserts nothing when every account already exists', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const queryInterface = fakeQueryInterface([
      'admin@example.com',
      'api-admin@example.com',
      'api-user@example.com',
      'user@example.com',
    ]);

    await seeder().up(queryInterface);

    expect(queryInterface.bulkInsert).not.toHaveBeenCalled();
  });

  it('inserts only the accounts that are missing', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const queryInterface = fakeQueryInterface([
      'admin@example.com',
      'user@example.com',
    ]);

    await seeder().up(queryInterface);

    expect(
      insertedUsers(queryInterface)
        .map((user) => user.email)
        .toSorted(byText),
    ).toEqual(['api-admin@example.com', 'api-user@example.com']);
  });
});

describe('demo user seeder — down', () => {
  it('removes exactly the seeded accounts', async () => {
    const queryInterface = fakeQueryInterface();

    await seeder().down(queryInterface);

    expect(queryInterface.bulkDelete).toHaveBeenCalledTimes(1);
    const [table, where] = queryInterface.bulkDelete.mock.calls[0];
    expect(table).toBe('Users');
    // Scoped to the roster — a bare bulkDelete('Users') would wipe real users.
    expect(where).toEqual({ email: seeder().DEMO_EMAILS });
  });
});
