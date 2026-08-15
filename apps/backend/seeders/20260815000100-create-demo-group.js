'use strict';
// Demo group seed — makes heimdall's GROUP-SCOPED authorization paths
// reachable without hand-building a group through the UI.
//
// This is not hypothetical coverage: the regression that started this work was
// GET /groups/my returning 500, and no seeded account could reproduce it.
//
// Mirrors mitre/vulcan's `db/seeds/data/05_memberships.rb`, which is a separate
// ordered file from `00_users.rb` and assigns memberships to the EXISTING demo
// users. The filename timestamp orders this after the user seeder.
const {
  DEMO_GROUP,
  DEMO_MEMBERSHIPS,
  demoSeedEnabled,
  readEnvConfig
  // Outside seeders/ deliberately — see the note in the demo user seeder and
  // test/seeders-directory-guard.spec.ts.
} = require('../seed-support/demo-seed-helpers');

const SELECT_USERS =
  'SELECT id, email FROM "Users" WHERE email IN (:emails)';
const SELECT_GROUP = 'SELECT id FROM "Groups" WHERE name = :name';
const SELECT_MEMBERSHIPS =
  'SELECT "userId" FROM "GroupUsers" WHERE "groupId" = :groupId';

function select(queryInterface, sql, replacements) {
  return queryInterface.sequelize.query(sql, {
    replacements,
    type: queryInterface.sequelize.QueryTypes.SELECT
  });
}

module.exports = {
  DEMO_GROUP,
  DEMO_MEMBERSHIPS,

  async up(queryInterface) {
    const envConfig = readEnvConfig();

    if (!demoSeedEnabled(envConfig)) {
      console.log(
        'Skipping demo group seed: not a development or test environment. ' +
          'Set SEED_DEMO_DATA=true to create demo data deliberately.'
      );
      return;
    }

    const emails = DEMO_MEMBERSHIPS.map((membership) => membership.email);
    const users = await select(queryInterface, SELECT_USERS, {emails});
    const idByEmail = new Map(
      users.map((user) => [user.email, String(user.id)])
    );
    const absent = emails.filter((email) => !idByEmail.has(email));

    if (absent.length > 0) {
      // Return rather than throw: cmd.sh runs `db:seed:all` under `set -e`, so
      // throwing here would abort the whole seed run — and in a container, the
      // boot. The user seeder is ordered before this one, so this only happens
      // when it was skipped or its accounts were removed.
      console.log(
        `Skipping demo group seed: demo user(s) not found — ${absent.join(', ')}. ` +
          'Run the demo user seeder first.'
      );
      return;
    }

    const now = new Date();
    let groupRows = await select(queryInterface, SELECT_GROUP, {
      name: DEMO_GROUP.name
    });

    if (groupRows.length === 0) {
      await queryInterface.bulkInsert(
        'Groups',
        [
          {
            createdAt: now,
            desc: DEMO_GROUP.desc,
            name: DEMO_GROUP.name,
            public: DEMO_GROUP.public,
            updatedAt: now
          }
        ],
        {}
      );
      // Groups.id is autoincrement, so the id is not knowable until it is read
      // back. Re-select rather than assume.
      groupRows = await select(queryInterface, SELECT_GROUP, {
        name: DEMO_GROUP.name
      });
      console.log(`Seeded demo group: ${DEMO_GROUP.name}`);
    }

    const groupId = groupRows.length > 0 ? String(groupRows[0].id) : undefined;
    if (groupId === undefined) {
      console.log(
        'Skipping demo group memberships: the demo group could not be read back.'
      );
      return;
    }

    const existing = await select(queryInterface, SELECT_MEMBERSHIPS, {
      groupId
    });
    const alreadyMember = new Set(
      existing.map((row) => String(row.userId))
    );
    const missing = DEMO_MEMBERSHIPS.filter(
      (membership) => !alreadyMember.has(idByEmail.get(membership.email))
    );

    if (missing.length === 0) {
      console.log('Demo group memberships already present — nothing to seed.');
      return;
    }

    await queryInterface.bulkInsert(
      'GroupUsers',
      missing.map((membership) => ({
        createdAt: now,
        groupId,
        // GroupUsers.role — owner|member, scoped to this group. NOT
        // Users.role, which is the app-wide admin|user concept.
        role: membership.role,
        updatedAt: now,
        userId: idByEmail.get(membership.email)
      })),
      {}
    );
    console.log(
      `Seeded ${missing.length} demo group membership(s): ` +
        missing.map((m) => `${m.email} as ${m.role}`).join(', ')
    );
  },

  async down(queryInterface) {
    const groupRows = await select(queryInterface, SELECT_GROUP, {
      name: DEMO_GROUP.name
    });

    if (groupRows.length > 0) {
      // Memberships first: the FK is ON DELETE SET NULL, so removing the group
      // alone would orphan its GroupUsers rows with a null groupId rather than
      // remove them.
      await queryInterface.bulkDelete('GroupUsers', {
        groupId: String(groupRows[0].id)
      });
    }

    // Scoped by name. The demo USERS belong to the user seeder's down() and are
    // deliberately left alone here.
    await queryInterface.bulkDelete('Groups', {name: DEMO_GROUP.name});
  }
};
