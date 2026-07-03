// migrations/XXXXXX-add-task-id-to-worklogs.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('work_logs', 'task_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'tasks',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('work_logs', 'task_id');
  }
};