// migrations/008-add-call-id-to-tasks.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'call_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'calls', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tasks', 'call_id');
  },
};