'use strict';

module.exports = {
  up: async (queryInterface, _Sequelize) => {
    const result = await queryInterface.sequelize.query(
      'SELECT COUNT(id) FROM "Policies" WHERE role = \'admin\' AND actions = \'delete\' AND targets = \'users\'',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )
    if(result[0].count === 0) {
      return queryInterface.bulkInsert('Policies', [{
        role: 'admin',
        actions: 'delete',
        targets: 'users',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    } else {
      console.log('Admin Delete Users Policy already exists. Skipping creation.')
      return queryInterface.sequelize.query('SELECT 1+1 AS result');
    }
  },

  down: (queryInterface, _Sequelize) => {
    return queryInterface.bulkDelete('Policies', null, {});
  }
};
