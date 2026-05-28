"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add display_id (14-char unique string shown in UI)
    await queryInterface.addColumn("tasks", "display_id", {
      type: Sequelize.STRING(14),
      allowNull: true,
      unique: true,
    });

    // Add remarks_log (JSONB array of remark objects)
    await queryInterface.addColumn("tasks", "remarks_log", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
    });

    // Make team_id nullable (teams are being removed; tasks now scoped by project_id)
    await queryInterface.changeColumn("tasks", "team_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("tasks", "display_id");
    await queryInterface.removeColumn("tasks", "remarks_log");

    await queryInterface.changeColumn("tasks", "team_id", {
      type: Sequelize.UUID,
      allowNull: false,
    });
  },
};