'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('leave_requests', 'worked_saturday_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'worked_saturdays',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('leave_requests', 'worked_saturday_id');
  },
};