'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('PipelineEvaluations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
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
      evaluationId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'Evaluations',
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
    return queryInterface.dropTable('PipelineEvaluations');
  }
};
