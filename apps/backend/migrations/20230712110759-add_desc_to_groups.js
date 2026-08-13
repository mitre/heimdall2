'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.addColumn('Groups', 'desc', {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: ''
      }, { transaction: t })
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.removeColumn('Groups', 'desc', { transaction: t })
    })
  }
};
