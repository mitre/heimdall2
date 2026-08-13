'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.addColumn('Users', 'jwtSecret', {
        type: Sequelize.STRING
      }, { transaction: t })
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.removeColumn('Users', 'jwtSecret', { transaction: t })
    })
  }
};
