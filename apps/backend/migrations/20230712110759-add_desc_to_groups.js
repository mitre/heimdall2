'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Groups', 'desc', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: ''
        }, { transaction: t }),
      ]).then(() => {
        // Update all existing evaluations in the database to be public
        // since we have no way of tracking who uploaded them.
        // All evaluations going forward will be private.
        queryInterface.bulkUpdate('Groups', { desc: '' })
      })
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Groups', 'desc', { transaction: t })
      ])
    })
  }
};
