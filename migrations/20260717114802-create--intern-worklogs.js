'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('intern_worklogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      display_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      intern_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'interns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      intern_project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'intern_projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      intern_task_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'intern_tasks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      hours: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: false,
      },
      log_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('intern_worklogs');
  },
};