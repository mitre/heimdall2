'use strict';

const sequelize = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((_t) => {
      return queryInterface.addColumn('Users', 'creationMethod', {
        type: sequelize.STRING,
        defaultValue: 'local'
      })
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.removeColumn('Users', 'creationMethod', { transaction: t })
    })
  }
};
