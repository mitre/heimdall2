'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('GroupProducts', {
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
      productId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'Products',
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
    return queryInterface.dropTable('GroupProducts');
  }
};
