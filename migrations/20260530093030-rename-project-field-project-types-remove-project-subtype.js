"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    const table = await queryInterface.describeTable("projects");

    // Remove old columns
    if (table.project_type) {
      await queryInterface.removeColumn("projects", "project_type");
    }

    if (table.project_subtype) {
      await queryInterface.removeColumn("projects", "project_subtype");
    }

    // Add new JSONB column
    if (!table.project_types) {
      await queryInterface.addColumn("projects", "project_types", {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      });
    }
  },

  async down(queryInterface, Sequelize) {

    const table = await queryInterface.describeTable("projects");

    // Remove new column
    if (table.project_types) {
      await queryInterface.removeColumn("projects", "project_types");
    }

    // Restore old columns
    if (!table.project_type) {
      await queryInterface.addColumn("projects", "project_type", {
        type: Sequelize.ENUM("web", "app", "desktop"),
        allowNull: true,
      });
    }

    if (!table.project_subtype) {
      await queryInterface.addColumn("projects", "project_subtype", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },
};