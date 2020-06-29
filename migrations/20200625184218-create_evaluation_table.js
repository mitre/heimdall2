'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.createTable('Evaluations', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        version: {
          type: Sequelize.STRING,
          allowNull: false
        }
      })
    },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Evaluations');
  }
};
