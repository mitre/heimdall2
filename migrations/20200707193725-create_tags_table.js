'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('EvaluationTags', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      key: {
        allowNull: false,
        type: Sequelize.STRING
      },
      value: {
        allowNull: false,
        type: Sequelize.STRING
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
    .then(() => {
      return queryInterface.addColumn('Evaluations', 'evaluationTagId', {
        type: Sequelize.BIGINT,
        references: {
          model: 'EvaluationTags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      })
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('EvaluationTags')
    .then(() => {
      return queryInterface.removeColumn('Evaluations', 'evaluationTagId')
    });
  }
};
