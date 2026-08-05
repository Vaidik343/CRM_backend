'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('leave_requests', 'emergency_sub_type', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('leave_requests', 'medical_document', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('leave_requests', 'emergency_sub_type');
    await queryInterface.removeColumn('leave_requests', 'medical_document');
  },
};