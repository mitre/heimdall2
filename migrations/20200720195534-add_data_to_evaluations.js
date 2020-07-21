'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Evaluations', 'data', {
          type: Sequelize.JSON,
          allowNull: false
        }, { transaction: t }),
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Evaluations', 'data', { transaction: t })
      ])
    })
  }
};
