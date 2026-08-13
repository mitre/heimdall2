'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction((t) => {
      return queryInterface.addColumn('Evaluations', 'public', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction: t })
    })
    // Update all existing evaluations in the database to be public
    // since we have no way of tracking who uploaded them.
    // All evaluations going forward will be private.
    // Runs after the transaction commits: the original chain never returned
    // this promise, so the backfill always executed against the committed
    // column — awaiting it inside the transaction would self-deadlock on the
    // ACCESS EXCLUSIVE lock addColumn holds. This form keeps that working
    // sequence but makes the migration's completion wait for the backfill.
    return queryInterface.bulkUpdate('Evaluations', { public: true })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.removeColumn('Evaluations', 'public', { transaction: t })
    })
  }
};
