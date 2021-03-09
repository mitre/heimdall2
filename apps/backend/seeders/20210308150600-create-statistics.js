'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, _Sequelize) => {
    const result = await queryInterface.sequelize.query(
      'SELECT COUNT(id) FROM "Statistics"',
      {type: queryInterface.sequelize.QueryTypes.SELECT}
    );

    if (result[0].count === '0') {
      console.log('No statistics row exists! Creating.');
      return queryInterface.bulkInsert(
        'Statistics',
        [
          {
            loginCount: 0,
            evaluationCount: 0,
            profileCount: 0,
            userCount: 0,
            userGroupCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        {}
      );
    } else {
      console.log('Statistics already exist. Skipping creation.');
      return queryInterface.sequelize.query('SELECT 1+1 AS result');
    }
  },

  down: (queryInterface, _Sequelize) => {
    // Delete all from statistics, there should only be one row
    return queryInterface.sequelize.query('DELETE FROM Statistics');
  }
};

