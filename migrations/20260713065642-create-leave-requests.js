'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_requests', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },

      display_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      leave_type: {
        type: Sequelize.ENUM('paid', 'unpaid', 'exchange'),
        allowNull: false,
      },

      reason_type: {
        type: Sequelize.ENUM('normal', 'emergency'),
        allowNull: false,
      },

      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      duration: {
        type: Sequelize.ENUM(
          'full_day',
          'first_half',
          'second_half'
        ),
        allowNull: false,
      },

      exchange_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM(
          'pending',
          'approved',
          'rejected',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },

      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('leave_requests');
  },
};