'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('GroupPipelines', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
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
      pipelineId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'Pipelines',
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
    return queryInterface.dropTable('GroupPipelines');
  }
};
