'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      productId: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      productURL: {
        type: Sequelize.STRING,
        allowNull: true
      },
      objectStoreKey: {
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
    return queryInterface.dropTable('Products');
  }
};
