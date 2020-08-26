'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Users', 'encryptedPassword', {
          type: Sequelize.STRING,
          allowNull: false
        }, { transaction: t }),
        queryInterface.addColumn('Users', 'passwordChangedAt', {
          type: Sequelize.STRING
        }, { transaction: t }),
        queryInterface.addColumn('Users', 'forcePasswordChange', {
          type: Sequelize.BOOLEAN,
        }, { transaction: t })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Users', 'encryptedPassword', { transaction: t }),
        queryInterface.removeColumn('Users', 'passwordChangedAt', { transaction: t }),
        queryInterface.removeColumn('Users', 'forcePasswordChange', { transaction: t }),
      ])
    })
  }
};
