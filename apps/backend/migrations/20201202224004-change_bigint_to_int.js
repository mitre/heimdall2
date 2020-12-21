'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.changeColumn('Users', 'loginCount', {
          type: Sequelize.INTEGER
        }, { transaction: t })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.changeColumn('Users', 'loginCount', {
          type: Sequelize.BIGINT
        }, { transaction: t })
      ])
    })
  }
};
