"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    // 1. Add new role_id column
    await queryInterface.addColumn("team_members", "role_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // 2. Remove old role ENUM column
    await queryInterface.removeColumn("team_members", "role");

  },

  async down(queryInterface, Sequelize) {

    // 1. Add old role column back
    await queryInterface.addColumn("team_members", "role", {
      type: Sequelize.ENUM(
        "Team Lead",
        "Sr. Developer",
        "Developer",
        "Junior Developer",
        "QA",
        "Designer",
        "Project Manager",
        "Intern",
        "Other"
      ),
      allowNull: false,
      defaultValue: "Developer",
    });

    // 2. Remove role_id column
    await queryInterface.removeColumn("team_members", "role_id");

  },
};   