'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Policy', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      role: {
        allowNull: false,
        type: Sequelize.STRING
      },
      actions: {
        allowNull: false,
        type: Sequelize.STRING
      },
      targets: {
        allowNull: false,
        type: Sequelize.STRING
      },
      attributes: {
        allowNull: true,
        type: Sequelize.JSON
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Policy');
  }
};
