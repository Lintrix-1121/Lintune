'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add each column only if it doesn't already exist.
    // To avoid errors if they already exist, you can use `addColumn` with try/catch,
    // but it's simpler to check the table schema first.
    // For safety, we'll add them one by one.

    await queryInterface.addColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'profilePicture', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'provider', {
      type: Sequelize.STRING,
      defaultValue: 'local'
    });

    await queryInterface.addColumn('users', 'providerId', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'refreshToken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'lastLoginAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: remove the added columns
    await queryInterface.removeColumn('users', 'password');
    await queryInterface.removeColumn('users', 'profilePicture');
    await queryInterface.removeColumn('users', 'provider');
    await queryInterface.removeColumn('users', 'providerId');
    await queryInterface.removeColumn('users', 'refreshToken');
    await queryInterface.removeColumn('users', 'lastLoginAt');
  }
};




// 'use strict';

// /** @type {import('sequelize-cli').Migration} */
// module.exports = {
//   async up (queryInterface, Sequelize) {
//     /**
//      * Add altering commands here.
//      *
//      * Example:
//      * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
//      */
//   },

//   async down (queryInterface, Sequelize) {
//     /**
//      * Add reverting commands here.
//      *
//      * Example:
//      * await queryInterface.dropTable('users');
//      */
//   }
// };
