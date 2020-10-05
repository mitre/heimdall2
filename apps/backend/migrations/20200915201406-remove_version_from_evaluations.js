'use strict';

module.exports = {
  up: (queryInterface, _) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Evaluations', 'version', {
          transaction: t
        })
      ])
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Evaluations', 'version', {
          type: Sequelize.STRING,
          allowNull: false
        }, {
          transaction: t
        }),
      ])
    })
  }
};
