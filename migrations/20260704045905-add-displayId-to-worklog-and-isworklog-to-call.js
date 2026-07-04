"use strict";

module.exports = {
  up: async (queryInterface, DataTypes) => {
    // Add display_id to work_logs
    await queryInterface.addColumn("work_logs", "display_id", {
      type: DataTypes.STRING,
      allowNull: true,
    });

    // Add is_worklog to calls
    await queryInterface.addColumn("calls", "is_worklog", {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("work_logs", "display_id");
    await queryInterface.removeColumn("calls", "is_worklog");
  },
};