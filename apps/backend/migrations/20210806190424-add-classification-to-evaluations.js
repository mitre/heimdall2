'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
   await queryInterface.addColumn('Evaluations', 'classification', {
     type: Sequelize.TEXT,
     allowNull: true
   })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Evaluations', 'classification', {
      type: Sequelize.TEXT,
      allowNull: true
    })
  }
};
