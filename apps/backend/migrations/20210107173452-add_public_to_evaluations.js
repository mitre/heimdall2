'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Evaluations', 'public', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction: t }),
      ]).then(() => {
        // Update all existing evaluations in the database to be public
        // since we have no way of tracking who uploaded them.
        // All evaluations going forward will be private.
        queryInterface.bulkUpdate('Evaluations', { public: true })
      })
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Evaluations', 'public', { transaction: t })
      ])
    })
  }
};
