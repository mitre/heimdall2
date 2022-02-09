'use strict';
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs');

module.exports = {
  up: async (queryInterface, _Sequelize) => {
    const result = await queryInterface.sequelize.query(
      'SELECT COUNT(id) FROM "Users" WHERE role = \'admin\'',
      {type: queryInterface.sequelize.QueryTypes.SELECT}
    );
    const envConfig = {
      ...dotenv.parse(fs.readFileSync('.env')),
      ...process.env
    };

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

      return queryInterface.bulkInsert(
        'Users',
        [
          {
            firstName: 'Admin',
            email: email,
            role: 'admin',
            encryptedPassword: bcrypt.hashSync(password, 14),
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
