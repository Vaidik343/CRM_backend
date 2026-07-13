'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'saturday_group', {
      type: Sequelize.ENUM('A', 'B'),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'saturday_group');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_saturday_group";'
    );
  },
};