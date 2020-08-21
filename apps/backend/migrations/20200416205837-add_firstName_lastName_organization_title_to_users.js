'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Users', 'firstName', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction: t }),
        queryInterface.addColumn('Users', 'lastName', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction: t }),
        queryInterface.addColumn('Users', 'organization', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction: t }),
        queryInterface.addColumn('Users', 'title', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction: t })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Users', 'firstName', { transaction: t }),
        queryInterface.removeColumn('Users', 'lastName', { transaction: t }),
        queryInterface.removeColumn('Users', 'organization', { transaction: t }),
        queryInterface.removeColumn('Users', 'title', { transaction: t })
      ])
    })
  }
};
