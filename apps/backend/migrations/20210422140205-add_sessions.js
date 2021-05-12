'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('session', {
      sid: {
        allowNull: false,
        type: Sequelize.STRING
      },
      sess: {
        allowNull: false,
        type: Sequelize.JSON
      },
      expire: {
        allowNull: false,
        type: Sequelize.DATE(6)
      }
    })
    await queryInterface.sequelize.query('ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;')
    await queryInterface.sequelize.query('CREATE INDEX "IDX_session_expire" ON "session" ("expire");')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('session');
  }
};
