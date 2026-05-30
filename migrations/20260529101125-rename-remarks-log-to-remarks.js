"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.renameColumn("tasks", "remarks_log", "remarks");
    await queryInterface.renameColumn("calls", "remarks_log", "remarks");
    await queryInterface.renameColumn("work_logs", "remarks_log", "remarks");
    await queryInterface.renameColumn("projects", "remarks_log", "remarks");
  },

  async down(queryInterface) {
    await queryInterface.renameColumn("tasks", "remarks", "remarks_log");
    await queryInterface.renameColumn("calls", "remarks", "remarks_log");
    await queryInterface.renameColumn("work_logs", "remarks", "remarks_log");
    await queryInterface.renameColumn("projects", "remarks", "remarks_log");
  },
};