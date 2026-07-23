'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('interns', 'reference_type', {
      type: Sequelize.ENUM(
        'employee',
        'intern',
        'college',
        'friend',
        'social_media',
        'website',
        'other'
      ),
      allowNull: true,
    });

    await queryInterface.addColumn('interns', 'reference_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('interns', 'reference_contact', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('interns', 'reference_contact');
    await queryInterface.removeColumn('interns', 'reference_name');
    await queryInterface.removeColumn('interns', 'reference_type');

    // Remove ENUM type (important for PostgreSQL)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_interns_reference_type";'
    );
  },
};