'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('User', 'firstName', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction: t }),
        queryInterface.addColumn('User', 'lastName', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction: t }),
        queryInterface.addColumn('User', 'organization', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction: t }),
        queryInterface.addColumn('User', 'title', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction: t })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('User', 'firstName', { transaction: t }),
        queryInterface.removeColumn('User', 'lastName', { transaction: t }),
        queryInterface.removeColumn('User', 'organization', { transaction: t }),
        queryInterface.removeColumn('User', 'title', { transaction: t })
      ])
    })
  }
};
