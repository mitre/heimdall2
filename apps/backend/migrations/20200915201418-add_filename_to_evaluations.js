'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Evaluations', 'filename', {
          type: Sequelize.STRING,
          allowNull: false
        }, {
          transaction: t
        }),
      ])
    })
  },

  down: (queryInterface, _) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Evaluations', 'filename', {
          transaction: t
        })
      ])
    })
  }
};
