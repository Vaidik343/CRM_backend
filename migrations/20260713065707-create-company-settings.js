'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('company_settings', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },

      office_start_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },

      full_day_notice_hours: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      half_day_notice_hours: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable('company_settings');
  },
};