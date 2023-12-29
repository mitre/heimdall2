'use strict';
const crypto = require('@heimdall/common/crypto');
const dotenv = require('dotenv');
const fs = require('fs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, _Sequelize) {
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
        console.log('Falling back to purely environment or undefined values!');
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
        envConfig.ADMIN_PASSWORD || crypto.asHexString(crypto.randomBytes(16));

      console.log(`New administrator email is: ${email}`);
      if (!adminUsesExternalAuth) {
        console.log('New administrator password is: ' + password);
        console.log('You should change this password on first login.');
      }

      return queryInterface.bulkInsert(
        'Users',
        [
          {
            firstName: 'Admin',
            email: email,
            role: 'admin',
            encryptedPassword: await crypto.hashAndSaltPassword(password, !(envConfig.USE_NEW_ENCRYPTION_STRATEGY?.toLowerCase() === 'true')),
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

  async down (queryInterface, _Sequelize) {
    return queryInterface.bulkDelete('Users', {role: 'admin'});
  }
};
