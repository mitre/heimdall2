'use strict';

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('Users', 'isDisabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }),

  down: (queryInterface) => queryInterface.removeColumn('Users', 'isDisabled')
};
