'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    console.log('No administrator user exists! Creating an administrator.')
    var password = require('crypto').randomBytes(16).toString('hex')
    console.log('New administrator password is: ' + password)
    console.log('You will be forced to change this password on first login.')
    return queryInterface.bulkInsert('Users', [{
        firstName: 'Admin',
        email: 'admin@heimdall.local',
        encryptedPassword: password,
        passwordChangedAt: new Date(),
        forcePasswordChange: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
  },

  down: (queryInterface, Sequelize) => {
    const Op = Sequelize.Op
    return queryInterface.bulkDelete(
      'Users',
      { email: 'admin@heimdall.local' },
    );
  }
};
