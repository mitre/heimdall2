'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.addColumn('ApiKeys', 'type', {
        type: Sequelize.STRING,
        defaultValue: 'user',
      }, { transaction: t })
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.removeColumn('ApiKeys', 'type', { transaction: t })
    })
  }
};
