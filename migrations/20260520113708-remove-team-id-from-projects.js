'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // Remove foreign key first (if exists)
    await queryInterface.removeConstraint(
      'projects',
      'projects_team_id_fkey'
    ).catch(() => {});

    // Remove column
    await queryInterface.removeColumn('projects', 'team_id');
  },

  async down(queryInterface, Sequelize) {

    // Add column back
    await queryInterface.addColumn('projects', 'team_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
};