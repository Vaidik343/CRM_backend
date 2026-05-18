// migrations/009-add-project-id-to-tasks.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'project_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'projects', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tasks', 'project_id');
  },
};