'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Pipelines', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      buildId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      buildType: {
        type: Sequelize.INTEGER,
        allowNull: true
      },      
      branchName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      groupId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'Groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      userId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    return queryInterface.dropTable('Pipelines');
  }
};
