import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

// CommonJS seeder outside the TS project, loaded through a runtime dynamic
// import held on an object — the pattern seeders.spec.ts established and that
// eslint-plugin-n can resolve, because the specifier is a variable.
const SEEDER_PATH = '../seeders/20260815000100-create-demo-group.js';

type Row = Record<string, unknown>;

type FakeQueryInterface = {
  bulkDelete: ReturnType<typeof vi.fn>;
  bulkInsert: ReturnType<typeof vi.fn>;
  sequelize: {
    QueryTypes: { SELECT: string };
    query: ReturnType<typeof vi.fn>;
  };
};

type Seeder = {
  DEMO_GROUP: { desc: string; name: string; public: boolean };
  DEMO_MEMBERSHIPS: { email: string; role: string }[];
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
 * Routes each SELECT the seeder makes. Defaults describe a database where the
 * demo users exist but the group does not — the normal first-run shape.
 */
function fakeQueryInterface(
  state: {
    groupRows?: Row[];
    membershipRows?: Row[];
    userRows?: Row[];
  } = {},
): FakeQueryInterface {
  const userRows = state.userRows ?? [
    { email: 'admin@example.com', id: '1' },
    { email: 'user@example.com', id: '2' },
  ];
  const groupRows = state.groupRows ?? [];
  const membershipRows = state.membershipRows ?? [];

  const bulkInsert = vi.fn().mockResolvedValue(undefined);
  const query = vi.fn().mockImplementation((sql: string) => {
    if (sql.includes('"Users"')) {
      return Promise.resolve(userRows);
    }
    if (sql.includes('"GroupUsers"')) {
      return Promise.resolve(membershipRows);
    }
    if (sql.includes('"Groups"')) {
      // After the seeder inserts the group, its re-read must find it — the id
      // is autoincrement, so the seeder cannot know it without asking.
      return Promise.resolve(
        groupRows.length > 0 || bulkInsert.mock.calls.some((c) => c[0] === 'Groups')
          ? [{ id: '10' }]
          : [],
      );
    }
    throw new Error(`unstubbed query: ${sql}`);
  });

  return {
    bulkDelete: vi.fn().mockResolvedValue(undefined),
    bulkInsert,
    sequelize: { QueryTypes: { SELECT: 'SELECT' }, query },
  };
}

/** Rows passed to bulkInsert for one table, flattened across calls. */
function inserted(queryInterface: FakeQueryInterface, table: string): Row[] {
  return queryInterface.bulkInsert.mock.calls.flatMap((call) =>
    call[0] === table ? (call[1] as Row[]) : [],
  );
}

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('SEED_DEMO_DATA', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('demo group seeder — production guard', () => {
  it('no-ops when NODE_ENV is production and SEED_DEMO_DATA is unset', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    // Asserted independently rather than assumed to be inherited from the user
    // seeder: a guard that exists only in a sibling file protects nothing here,
    // and cmd.sh runs db:seed:all on every container start.
    expect(queryInterface.bulkInsert).not.toHaveBeenCalled();
  });

  it('seeds in production when SEED_DEMO_DATA opts in explicitly', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SEED_DEMO_DATA', 'true');
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    expect(queryInterface.bulkInsert).toHaveBeenCalled();
  });
});

describe('demo group seeder — group and membership', () => {
  it('creates exactly one group, with the NOT NULL columns supplied', async () => {
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    const groups = inserted(queryInterface, 'Groups');
    expect(groups).toHaveLength(1);
    // Groups.name is NOT NULL and UNIQUE; desc is NOT NULL default ''; public
    // is NOT NULL. Supplying them explicitly is what keeps the insert legal.
    expect(groups[0].name).toBe(seeder().DEMO_GROUP.name);
    expect(groups[0].desc).toBe(seeder().DEMO_GROUP.desc);
    expect(groups[0].public).toBe(seeder().DEMO_GROUP.public);
  });

  it('makes admin@example.com an OWNER and user@example.com a MEMBER', async () => {
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    const memberships = inserted(queryInterface, 'GroupUsers');
    const roleByUserId = new Map(
      memberships.map((row) => [row.userId, row.role]),
    );
    // GroupUsers.role is the GROUP-SCOPED concept (owner|member) — a different
    // column from Users.role (admin|user), which sked.1 owns. Writing the wrong
    // one produces a seed that looks right and tests nothing.
    expect(roleByUserId.get('1')).toBe('owner');
    expect(roleByUserId.get('2')).toBe('member');
    expect(memberships).toHaveLength(2);
    for (const row of memberships) {
      expect(row.groupId).toBe('10');
    }
  });

  it('REUSES the seeded users instead of creating group-specific accounts', async () => {
    const queryInterface = fakeQueryInterface();

    await seeder().up(queryInterface);

    // Vulcan's 05_memberships.rb assigns memberships to the existing demo
    // users; it does not mint group-owner@/group-member@ accounts. This card
    // follows that deliberately.
    expect(inserted(queryInterface, 'Users')).toHaveLength(0);
  });
});

describe('demo group seeder — idempotency', () => {
  it('inserts nothing when the group and both memberships already exist', async () => {
    const queryInterface = fakeQueryInterface({
      groupRows: [{ id: '10' }],
      membershipRows: [{ userId: '1' }, { userId: '2' }],
    });

    await seeder().up(queryInterface);

    expect(queryInterface.bulkInsert).not.toHaveBeenCalled();
  });

  it('adds only the missing membership when the group already exists', async () => {
    const queryInterface = fakeQueryInterface({
      groupRows: [{ id: '10' }],
      membershipRows: [{ userId: '1' }],
    });

    await seeder().up(queryInterface);

    expect(inserted(queryInterface, 'Groups')).toHaveLength(0);
    const memberships = inserted(queryInterface, 'GroupUsers');
    expect(memberships).toHaveLength(1);
    expect(memberships[0].userId).toBe('2');
    expect(memberships[0].role).toBe('member');
  });
});

describe('demo group seeder — missing prerequisite', () => {
  it('skips cleanly when the demo users are absent, without throwing', async () => {
    const queryInterface = fakeQueryInterface({ userRows: [] });

    // cmd.sh runs db:seed:all under `set -e`, so throwing here would abort the
    // whole seed run and, in a container, the boot.
    await expect(seeder().up(queryInterface)).resolves.not.toThrow();
    expect(queryInterface.bulkInsert).not.toHaveBeenCalled();
  });
});

describe('demo group seeder — down', () => {
  it('removes the memberships and the group, leaving the users intact', async () => {
    const queryInterface = fakeQueryInterface({ groupRows: [{ id: '10' }] });

    await seeder().down(queryInterface);

    const tables = queryInterface.bulkDelete.mock.calls.map((call) => call[0]);
    expect(tables).toEqual(['GroupUsers', 'Groups']);
    // Users are owned by sked.1's seeder; removing them here would break its
    // down() contract and delete accounts this card never created.
    expect(tables).not.toContain('Users');
  });
});
