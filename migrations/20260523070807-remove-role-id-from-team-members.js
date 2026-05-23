module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("team_members", "role_id");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("team_members", "role_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },
};