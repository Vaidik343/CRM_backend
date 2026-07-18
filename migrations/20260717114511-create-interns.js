'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interns', {
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
      intern_type: {
        type: Sequelize.ENUM('intern', 'trainee'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'active', 'completed'),
        defaultValue: 'pending',
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      mobile: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      enrollment_no: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      college_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      degree_type: {
        type: Sequelize.ENUM('bachelor', 'master'),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      mentor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      last_login: {
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
    await queryInterface.dropTable('interns');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_interns_intern_type";
      DROP TYPE IF EXISTS "enum_interns_status";
      DROP TYPE IF EXISTS "enum_interns_degree_type";
    `);
  },
};