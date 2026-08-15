'use strict';
// Demo/test user seed — stable, documented credentials so a developer never
// has to invent accounts by hand or ask a colleague for a password.
//
// WHY THIS EXISTS: heimdall2 had exactly one seeder, which creates
// admin@heimdall.local with a random password printed once. On 2026-08-15 that
// cost a live debugging session — the only working accounts in the developer's
// database were ones an agent had registered through the signup form hours
// earlier. Mirrors mitre/vulcan's `db/seeds/data/00_users.rb`.
//
// The `dist/src/` require path is load-bearing for the same reason the
// administrator seeder documents: nest build infers rootDir across
// src/db/config, emitting dist/src/crypto/password.js.
const {hashPassword} = require('../dist/src/crypto/password');
const {
  DEMO_EMAILS,
  DEMO_PASSWORD,
  DEMO_USERS,
  demoSeedEnabled,
  hashOptions,
  readEnvConfig,
  resolvePassword
  // Lives OUTSIDE seeders/ deliberately: sequelize-cli loads every .js in that
  // directory as a seeder and calls up() on it, so a support module parked
  // there kills `db:seed:all` — which cmd.sh runs under `set -e` before
  // starting the app. Guarded by test/seeders-directory-guard.spec.ts.
} = require('../seed-support/demo-seed-helpers');

module.exports = {
  DEMO_EMAILS,
  DEMO_PASSWORD,

  async up(queryInterface) {
    const envConfig = readEnvConfig();

    if (!demoSeedEnabled(envConfig)) {
      console.log(
        'Skipping demo user seed: not a development or test environment. ' +
          'Set SEED_DEMO_DATA=true to create demo accounts deliberately.'
      );
      return;
    }

    const existing = await queryInterface.sequelize.query(
      'SELECT email FROM "Users" WHERE email IN (:emails)',
      {
        replacements: {emails: DEMO_EMAILS},
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );
    const present = new Set(existing.map((row) => row.email));
    const missing = DEMO_USERS.filter((user) => !present.has(user.email));

    if (missing.length === 0) {
      console.log('Demo users already present — nothing to seed.');
      return;
    }

    const password = resolvePassword(envConfig);
    const options = hashOptions(envConfig);
    const now = new Date();

    // Hashed per user, so each row carries its own salt. Reusing one hash
    // across accounts would leak that they share a password.
    //
    // Always PBKDF2, never the administrator seeder's bcrypt fallback. That
    // fallback exists for the ADR-006 §12 rolling window, where a pre-N pod
    // must still read a credential written by a newer one — a situation that
    // cannot arise here, because this seeder only ever runs in development and
    // test. PBKDF2 is also the only FIPS-safe choice, and verifyPassword
    // dispatches on the hash prefix, so these rows are readable regardless of
    // how the write gate is currently set. This seeder deliberately does NOT
    // plant the §12 marker: the administrator seeder owns that, and planting
    // it from two places is exactly the defect an earlier AC review caught.
    const rows = [];
    for (const user of missing) {
      rows.push({
        createdAt: now,
        creationMethod: 'local',
        email: user.email,
        encryptedPassword: await hashPassword(password, options),
        firstName: user.firstName,
        // Demo logins must not be interrupted by a forced password change —
        // the roster exists for a fast, repeatable login loop.
        forcePasswordChange: false,
        lastName: user.lastName,
        passwordChangedAt: now,
        role: user.role,
        updatedAt: now
      });
    }

    await queryInterface.bulkInsert('Users', rows, {});
    console.log(
      `Seeded ${rows.length} demo user(s): ${rows
        .map((row) => row.email)
        .join(', ')}`
    );
    console.log(
      envConfig.SEED_PASSWORD
        ? 'Demo password taken from SEED_PASSWORD.'
        : `Demo password is the documented default: ${DEMO_PASSWORD}`
    );
  },

  async down(queryInterface) {
    // Scoped to the roster. A bare bulkDelete('Users') would remove real
    // accounts alongside the demo ones.
    await queryInterface.bulkDelete('Users', {email: DEMO_EMAILS});
  }
};
