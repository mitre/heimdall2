import {describe, it, expect} from 'vitest';
import {eq} from 'drizzle-orm';
import {userFactory} from './user.factory';
import {groupFactory} from './group.factory';
import {groupMemberFactory} from './group-member.factory';
import {evaluationFactory} from './evaluation.factory';
import {apiKeyFactory} from './api-key.factory';
import {legacyUserFactory} from './legacy-user.factory';
import {createTestOrg} from './index';
import {ba_user, ba_account} from '../auth-schema.generated';
import {users, groups, groupUsers, evaluationTags, apiKeys} from '../schema';
import {test} from '../test-fixture';

describe('legacyUserFactory', () => {
  describe('.build()', () => {
    it('returns a plain object with default fields for legacy Users table', () => {
      const user = legacyUserFactory.build();
      expect(user.email).toMatch(/@test\.heimdall\.local$/i);
      expect(user.encryptedPassword).toBe('$2b$14$placeholder');
      expect(user.role).toBe('user');
      expect(user.creationMethod).toBe('local');
      expect(user.loginCount).toBe(0);
    });

    it('generates unique emails on each call', () => {
      const a = legacyUserFactory.build();
      const b = legacyUserFactory.build();
      expect(a.email).not.toBe(b.email);
    });
  });

  describe('.create(db)', () => {
    test('inserts into legacy Users table and returns row with numeric id', async ({db}) => {
      const user = await legacyUserFactory.create(db);
      expect(user.id).toBeDefined();
      expect(user.email).toMatch(/@test\.heimdall\.local$/i);

      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id));
      expect(found).toBeDefined();
      expect(found.email).toBe(user.email);
    });
  });
});

describe('userFactory', () => {
  describe('.build()', () => {
    it('returns a plain object with default fields', () => {
      const user = userFactory.build();
      expect(user.id).toBeTypeOf('string');
      expect(user.id.length).toBeGreaterThan(0);
      expect(user.email).toMatch(/^test-\d+-[a-f0-9]{8}@test\.heimdall\.local$/);
      expect(user.name).toMatch(/^Test User \d+$/);
      expect(user.role).toBe('user');
      expect(user.creationMethod).toBe('local');
      expect(user.emailVerified).toBe(true);
    });

    it('accepts partial overrides', () => {
      const user = userFactory.build({
        email: 'admin@example.com',
        role: 'admin',
        firstName: 'Jane',
      });
      expect(user.email).toBe('admin@example.com');
      expect(user.role).toBe('admin');
      expect(user.firstName).toBe('Jane');
      expect(user.name).toMatch(/^Test User/);
    });

    it('generates unique emails on each call', () => {
      const a = userFactory.build();
      const b = userFactory.build();
      expect(a.email).not.toBe(b.email);
      expect(a.id).not.toBe(b.id);
    });

    it('does not include a password field', () => {
      const user = userFactory.build();
      expect('password' in user).toBe(false);
    });
  });

  describe('.create(db)', () => {
    test('inserts into ba_user and returns the row', async ({db}) => {
      const user = await userFactory.create(db);
      expect(user.id).toBeTypeOf('string');
      expect(user.email).toMatch(/@test\.heimdall\.local$/i);
      expect(user.role).toBe('user');

      const [found] = await db
        .select()
        .from(ba_user)
        .where(eq(ba_user.id, user.id));
      expect(found).toBeDefined();
      expect(found.email).toBe(user.email);
    });

    test('hashes password and creates ba_account credential', async ({db}) => {
      const user = await userFactory.create(db, {
        password: 'Ab1!cDe2@fGh3#iJk',
      });

      const [account] = await db
        .select()
        .from(ba_account)
        .where(eq(ba_account.userId, user.id));
      expect(account).toBeDefined();
      expect(account.providerId).toBe('credential');
      expect(account.password).toMatch(/^\$2[ab]\$14\$/);
      expect(account.password).not.toBe('Ab1!cDe2@fGh3#iJk');
    });

    test('rejects passwords that fail STIG policy with specific error message', async ({db}) => {
      await expect(
        userFactory.create(db, {password: 'short'}),
      ).rejects.toThrow(/at least \d+ characters/);
    });

    test('defaults forcePasswordChange to false for non-bootstrap users', async ({db}) => {
      const user = await userFactory.create(db);
      expect(user.forcePasswordChange).toBe(false);
    });

    test('does not leave orphaned ba_user row when password validation fails', async ({db}) => {
      const uniqueEmail = `orphan-test-${Date.now()}@test.heimdall.local`;
      await expect(
        userFactory.create(db, {email: uniqueEmail, password: 'weak'}),
      ).rejects.toThrow();

      const orphans = await db
        .select()
        .from(ba_user)
        .where(eq(ba_user.email, uniqueEmail));
      expect(orphans).toHaveLength(0);
    });

    test('accepts role override', async ({db}) => {
      const admin = await userFactory.create(db, {role: 'admin'});
      expect(admin.role).toBe('admin');
    });

    test('creates user without password when none provided', async ({db}) => {
      const user = await userFactory.create(db);

      const accounts = await db
        .select()
        .from(ba_account)
        .where(eq(ba_account.userId, user.id));
      expect(accounts).toHaveLength(0);
    });
  });
});

describe('groupFactory', () => {
  describe('.build()', () => {
    it('returns a group with default fields', () => {
      const group = groupFactory.build();
      expect(group.name).toMatch(/^Test Group \d+-[a-f0-9]{8}$/);
      expect(group.public).toBe(false);
      expect(group.desc).toBe('');
    });

    it('accepts overrides', () => {
      const group = groupFactory.build({name: 'Security Team', public: true});
      expect(group.name).toBe('Security Team');
      expect(group.public).toBe(true);
    });
  });

  describe('.create(db)', () => {
    test('inserts into Groups and returns the row with id', async ({db}) => {
      const group = await groupFactory.create(db);
      expect(group.id).toBeDefined();
      expect(group.name).toMatch(/^Test Group \d+-[a-f0-9]{8}$/);

      const [found] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, group.id));
      expect(found).toBeDefined();
      expect(found.name).toBe(group.name);
    });
  });
});

describe('groupMemberFactory', () => {
  describe('.build()', () => {
    it('returns a plain object with default role', () => {
      const member = groupMemberFactory.build({userId: 1, groupId: 1});
      expect(member.role).toBe('member');
      expect(member.userId).toBe(1);
      expect(member.groupId).toBe(1);
      expect(member.createdAt).toBeTypeOf('string');
    });

    it('accepts role override', () => {
      const owner = groupMemberFactory.build({userId: 1, groupId: 1, role: 'owner'});
      expect(owner.role).toBe('owner');
    });
  });

  test('creates a membership linking user and group', async ({db}) => {
    const user = await legacyUserFactory.create(db);
    const group = await groupFactory.create(db);
    const membership = await groupMemberFactory.create(db, {
      userId: user.id,
      groupId: group.id,
    });

    expect(membership.role).toBe('member');

    const [found] = await db
      .select()
      .from(groupUsers)
      .where(eq(groupUsers.id, membership.id));
    expect(found).toBeDefined();
  });

  test('accepts role override on create', async ({db}) => {
    const user = await legacyUserFactory.create(db);
    const group = await groupFactory.create(db);
    const membership = await groupMemberFactory.create(db, {
      userId: user.id,
      groupId: group.id,
      role: 'owner',
    });
    expect(membership.role).toBe('owner');
  });

  test('rejects invalid userId with FK violation', async ({db}) => {
    const group = await groupFactory.create(db);
    await expect(
      groupMemberFactory.create(db, {userId: 999999, groupId: group.id}),
    ).rejects.toThrow(/Failed query.*insert.*GroupUsers/i);
  });
});

describe('evaluationFactory', () => {
  describe('.build()', () => {
    it('returns an evaluation with default fields', () => {
      const evaluation = evaluationFactory.build();
      expect(evaluation.filename).toMatch(/^test-eval-\d+-[a-f0-9]{8}\.json$/);
      expect(evaluation.public).toBe(false);
      expect(evaluation.data).toEqual({});
    });
  });

  describe('.create(db)', () => {
    test('inserts into Evaluations and returns the row', async ({db}) => {
      const evaluation = await evaluationFactory.create(db);
      expect(evaluation.id).toBeDefined();
      expect(evaluation.filename).toMatch(/^test-eval-\d+-[a-f0-9]{8}\.json$/);
    });

    test('creates evaluation tags when provided', async ({db}) => {
      const evaluation = await evaluationFactory.create(db, {
        tags: ['stig', 'rhel9'],
      });

      const tags = await db
        .select()
        .from(evaluationTags)
        .where(eq(evaluationTags.evaluationId, evaluation.id));
      expect(tags).toHaveLength(2);
      expect(tags.map((t) => t.value).sort()).toEqual(['rhel9', 'stig']);
    });

    test('assigns userId when provided as override', async ({db}) => {
      const user = await legacyUserFactory.create(db);
      const evaluation = await evaluationFactory.create(db, {userId: user.id});
      expect(evaluation.userId).toBe(user.id);
    });
  });
});

describe('apiKeyFactory', () => {
  describe('.build()', () => {
    it('returns a plain object with default fields', () => {
      const key = apiKeyFactory.build({userId: 1});
      expect(key.name).toMatch(/^test-key-\d+-[a-f0-9]{8}$/);
      expect(key.apiKey).toBeTypeOf('string');
      expect(key.apiKey!.length).toBe(64);
      expect(key.type).toBe('personal');
      expect(key.userId).toBe(1);
    });
  });

  test('inserts into ApiKeys and returns the row', async ({db}) => {
    const key = await apiKeyFactory.create(db, {userId: 1});
    expect(key.id).toBeDefined();
    expect(key.name).toMatch(/^test-key-\d+-[a-f0-9]{8}$/);
    expect(key.apiKey).toBeTypeOf('string');

    const [found] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, key.id));
    expect(found).toBeDefined();
  });
});

describe('createTestOrg', () => {
  test('creates a group with users, memberships, and evaluations', async ({db}) => {
    const org = await createTestOrg(db, {userCount: 2, evaluationCount: 3});

    expect(org.group.id).toBeDefined();
    expect(org.users).toHaveLength(2);
    expect(org.memberships).toHaveLength(2);
    expect(org.evaluations).toHaveLength(3);

    const memberRows = await db
      .select()
      .from(groupUsers)
      .where(eq(groupUsers.groupId, org.group.id));
    expect(memberRows).toHaveLength(2);
  });

  test('accepts custom groupName', async ({db}) => {
    const org = await createTestOrg(db, {
      userCount: 1,
      evaluationCount: 0,
      groupName: 'Custom Security Team',
    });
    expect(org.group.name).toBe('Custom Security Team');
  });

  test('first user is owner, rest are members', async ({db}) => {
    const org = await createTestOrg(db, {userCount: 3, evaluationCount: 0});

    expect(org.memberships[0].role).toBe('owner');
    expect(org.memberships[1].role).toBe('member');
    expect(org.memberships[2].role).toBe('member');
  });
});
