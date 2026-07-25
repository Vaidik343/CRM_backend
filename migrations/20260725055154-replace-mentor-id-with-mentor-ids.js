'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // ===========================
    // interns table
    // ===========================

    await queryInterface.removeColumn('interns', 'mentor_id');

    await queryInterface.addColumn('interns', 'mentor_ids', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
    });


    // ===========================
    // intern_projects table
    // ===========================

    await queryInterface.removeColumn('intern_projects', 'mentor_id');

    await queryInterface.addColumn('intern_projects', 'mentor_ids', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
    });

  },

  async down(queryInterface, Sequelize) {

    // ===========================
    // interns table
    // ===========================

    await queryInterface.removeColumn('interns', 'mentor_ids');

    await queryInterface.addColumn('interns', 'mentor_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });


    // ===========================
    // intern_projects table
    // ===========================

    await queryInterface.removeColumn('intern_projects', 'mentor_ids');

    await queryInterface.addColumn('intern_projects', 'mentor_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });

  }
};