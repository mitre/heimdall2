'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('EvaluationFiles', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        filename: {allowNull: false, type: Sequelize.STRING},
        role: {allowNull: false, type: Sequelize.STRING},
        data: {allowNull: false, type: Sequelize.BLOB},
        createdAt: {allowNull: false, type: Sequelize.DATE},
        updatedAt: {allowNull: false, type: Sequelize.DATE}
      }, {transaction});
      await queryInterface.addColumn('Evaluations', 'originalFileId', {
        allowNull: true,
        type: Sequelize.BIGINT,
        references: {model: 'EvaluationFiles', key: 'id'},
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }, {transaction});
      await queryInterface.addIndex('Evaluations', ['originalFileId'], {transaction});
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Evaluations', 'originalFileId', {transaction});
      await queryInterface.dropTable('EvaluationFiles', {transaction});
    });
  }
};
