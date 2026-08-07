'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_leave_requests_reason_type" ADD VALUE IF NOT EXISTS 'casual';
    `);
    // Update old 'normal' rows to 'casual'
    await queryInterface.sequelize.query(`
      UPDATE leave_requests SET reason_type = 'casual' WHERE reason_type = 'normal';
    `);
  },

  down: async (queryInterface) => {
    // Cannot remove enum values in PostgreSQL easily — leave as is
  },
};