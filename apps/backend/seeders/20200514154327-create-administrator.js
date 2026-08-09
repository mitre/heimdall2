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
const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs');

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

      const encryptedPassword = await hashPassword(password);
      return queryInterface.bulkInsert(
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
    } else {
      console.log('Administrator exists. Skipping creation.');
      return queryInterface.sequelize.query('SELECT 1+1 AS result');
    }
  },

  down: (queryInterface, _Sequelize) => {
    return queryInterface.bulkDelete('Users', {role: 'admin'});
  }
};
