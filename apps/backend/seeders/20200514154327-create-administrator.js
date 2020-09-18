'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, _Sequelize) => {
    const result = await queryInterface.sequelize.query(
      'SELECT COUNT(id) FROM "Users" WHERE role = \'admin\'',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )

    if(result[0].count === 0) {
      console.log('No administrator user exists! Creating an administrator.')
      var password = require('crypto').randomBytes(16).toString('hex')
      console.log('New administrator password is: ' + password)
      console.log('You will be forced to change this password on first login.')
      return queryInterface.bulkInsert('Users', [{
          firstName: 'Admin',
          email: 'admin@heimdall.local',
          role: 'admin',
          encryptedPassword: bcrypt.hashSync(password, 14),
          passwordChangedAt: new Date(),
          forcePasswordChange: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        {}
      );
    } else {
      console.log('Administrator exists. Skipping creation.')
      return queryInterface.sequelize.query('SELECT 1+1 AS result');
    }
  },

  down: (queryInterface, _Sequelize) => {
    return queryInterface.bulkDelete(
      'Users',
      { role: 'admin' },
    );
  }
};
