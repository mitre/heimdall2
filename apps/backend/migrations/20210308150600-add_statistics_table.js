'use strict';

const sequelize = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.createTable('Statistics', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT
          },
          loginCount: {
            type: sequelize.BIGINT,
            defaultValue: 0,
            allowNull: false
          },
          evaluationCount: {
            type: sequelize.BIGINT,
            defaultValue: 0,
            allowNull: false
          },
          evaluationTagCount: {
            type: sequelize.BIGINT,
            defaultValue: 0,
            allowNull: false
          },
          profileCount: {
            type: sequelize.BIGINT,
            defaultValue: 0,
            allowNull: false
          },
          userCount: {
            type: sequelize.BIGINT,
            defaultValue: 0,
            allowNull: false
          },
          userGroupCount: {
            type: sequelize.BIGINT,
            defaultValue: 0,
            allowNull: false
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
      ]);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.dropTable('Statistics', {transaction: t})
      ]);
    });
  }
};
