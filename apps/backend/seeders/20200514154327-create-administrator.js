'use strict';
// ADR-006 §4 site 8: the admin bootstrap must hash through the SINGLE
// FIPS-validated implementation, not bcrypt. This seeder is CommonJS, runs
// outside Nest DI and the TS build, and executes on every container start
// (cmd.sh runs db:seed:all), so it requires the COMPILED pure function. The
// `dist/src/` segment is load-bearing — nest build infers rootDir across
// src/db/config, emitting dist/src/crypto/password.js. `.sequelizerc` already
// depends on build output; a bad path is a boot crash loop under cmd.sh's
// `set -e`, not a degraded seed.
const {hashPassword} = require('../dist/src/crypto/password');
const {
  deriveHashWriteState,
  SUPPORTED_HASH_MARKER_VERSION
} = require('../dist/src/crypto/hash-write-decision');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs');

// ADR-006 §12: site 8 sits inside the rollout write gate's scope. The
// DECISION is the same compiled pure function the Nest gate service uses
// (hash-write-decision.js) — this file only supplies the DB probes it cannot
// inject. cmd.sh runs this seeder BEFORE the app's first boot, so on a fresh
// install THIS file performs the first PBKDF2 write — and therefore plants
// the §12 durable marker (first-write trigger, not install-time: no write,
// no marker). Without that planting, the app's first derivation would see
// the seeded admin as "existing users, no marker" and default the gate OFF
// forever (AC-review round-1 finding).
async function hashWriteDecision(queryInterface, envConfig) {
  const explicitSetting = envConfig.PASSWORD_HASH_WRITE_ENABLED;
  if (explicitSetting === 'true' || explicitSetting === 'false') {
    return deriveHashWriteState({
      explicitSetting,
      markerPresent: false,
      usersPresent: false
    });
  }
  const markers = await queryInterface.sequelize.query(
    'SELECT COUNT(id) FROM "HashMigrationMarkers"',
    {type: queryInterface.sequelize.QueryTypes.SELECT}
  );
  const users = await queryInterface.sequelize.query(
    'SELECT COUNT(id) FROM "Users"',
    {type: queryInterface.sequelize.QueryTypes.SELECT}
  );
  return deriveHashWriteState({
    explicitSetting,
    markerPresent: markers[0].count !== '0',
    usersPresent: users[0].count !== '0'
  });
}

module.exports = {
  up: async (queryInterface, _Sequelize) => {
    const result = await queryInterface.sequelize.query(
      'SELECT COUNT(id) FROM "Users" WHERE role = \'admin\'',
      {type: queryInterface.sequelize.QueryTypes.SELECT}
    );

    let envConfig = {};
    try {
      envConfig = dotenv.parse(fs.readFileSync('.env'));
      console.log('Read config!');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File probably does not exist
        console.log('Unable to read configuration file `.env`!');
        console.log('Falling back to environment or undefined values!');
      } else {
        throw error;
      }
    }
    envConfig = {...envConfig, ...process.env};

    if (result[0].count === '0') {
      console.log('No administrator user exists! Creating an administrator.');
      const email = envConfig.ADMIN_EMAIL || 'admin@heimdall.local';
      let adminUsesExternalAuth = false;
      if (
        envConfig.ADMIN_USES_EXTERNAL_AUTH &&
        typeof envConfig.ADMIN_USES_EXTERNAL_AUTH === 'string'
      ) {
        adminUsesExternalAuth =
          envConfig.ADMIN_USES_EXTERNAL_AUTH.toLowerCase() === 'true';
      }
      const password =
        envConfig.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');

      console.log(`New administrator email is: ${email}`);
      if (!adminUsesExternalAuth) {
        console.log('New administrator password is: ' + password);
        console.log('You should change this password on first login.');
      }

      let encryptedPassword;
      let plantMarker = false;
      if ((await hashWriteDecision(queryInterface, envConfig)).enabled) {
        encryptedPassword = await hashPassword(password);
        plantMarker = true;
      } else {
        // §12 rolling window: a pre-N pod must be able to read this admin
        // credential, so fall back to bcrypt (cost 14, the historical
        // parameter) — except under FIPS mode, where generating a bcrypt
        // hash is itself a finding (V-222571): refuse loudly instead, the
        // same coherence rule as PasswordService.hash.
        if (crypto.getFips() === 1) {
          throw new Error(
            'PASSWORD_HASH_WRITE_ENABLED=false is incompatible with FIPS ' +
              'mode: the admin bootstrap cannot generate a bcrypt fallback ' +
              'hash inside the validated boundary (V-222571). Enable PBKDF2 ' +
              'writes or disable FIPS mode.'
          );
        }
        encryptedPassword = await bcrypt.hash(password, 14);
      }
      await queryInterface.bulkInsert(
        'Users',
        [
          {
            firstName: 'Admin',
            email: email,
            role: 'admin',
            encryptedPassword: encryptedPassword,
            creationMethod: adminUsesExternalAuth ? 'ldap' : 'local',
            passwordChangedAt: new Date(),
            forcePasswordChange: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        {}
      );
      if (plantMarker) {
        // §12 first-write planting: on a fresh install THIS was the first
        // PBKDF2 write, and the app's later derivation reads the marker back
        // (sticky). Idempotent — skip when a row for this epoch exists.
        const planted = await queryInterface.sequelize.query(
          'SELECT COUNT(id) FROM "HashMigrationMarkers"',
          {type: queryInterface.sequelize.QueryTypes.SELECT}
        );
        if (planted[0].count === '0') {
          await queryInterface.bulkInsert(
            'HashMigrationMarkers',
            [
              {
                markerVersion: SUPPORTED_HASH_MARKER_VERSION,
                pbkdf2WritesBeganAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ],
            {}
          );
        }
      }
      return;
    } else {
      console.log('Administrator exists. Skipping creation.');
      return queryInterface.sequelize.query('SELECT 1+1 AS result');
    }
  },

  down: (queryInterface, _Sequelize) => {
    return queryInterface.bulkDelete('Users', {role: 'admin'});
  }
};
