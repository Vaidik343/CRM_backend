"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn(
      "projects",
      "development_status",
      {
        type: Sequelize.ENUM(
          "planning",
          "active",
          "on_hold",
          "testing",
          "completed"
        ),
        allowNull: true,
        defaultValue: "active",
      }
    );

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn(
      "projects",
      "development_status"
    );

  },
};