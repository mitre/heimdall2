'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Users', 'loginCount', {
          type: Sequelize.BIGINT,
          defaultValue: 0,
          allowNull: false
        }, { transaction: t }),
        queryInterface.addColumn('Users', 'lastLogin', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction: t })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Users', 'loginCount', { transaction: t}),
        queryInterface.removeColumn('Users', 'lastLogin', { transaction: t })
      ])
    })
  }
};
