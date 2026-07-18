'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('intern_tasks', {
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
      task: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('open', 'ongoing', 'hold', 'closed'),
        defaultValue: 'open',
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      remarks: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable('intern_tasks');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_intern_tasks_status";
    `);
  },
};