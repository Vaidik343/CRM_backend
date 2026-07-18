'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_probation', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn('users', 'probation_start', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'probation_end', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'probation_status', {
      type: Sequelize.ENUM('active', 'passed', 'terminated'),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'is_probation');
    await queryInterface.removeColumn('users', 'probation_start');
    await queryInterface.removeColumn('users', 'probation_end');
    await queryInterface.removeColumn('users', 'probation_status');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_users_probation_status";
    `);
  },
};