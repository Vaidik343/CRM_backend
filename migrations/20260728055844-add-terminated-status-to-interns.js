'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_interns_status"
      ADD VALUE IF NOT EXISTS 'terminated';
    `);
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL does not support removing enum values.
    // Leave this empty.
  },
};