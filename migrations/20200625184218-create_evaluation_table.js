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
        }
<<<<<<< HEAD
        version: {
          type: Sequelize.STRING,
          allowNull: false
        }
=======
>>>>>>> 1e60cf181be85c19cb3db147ff6aef31fa3851e9
      })
    },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Evaluations');
  }
};
