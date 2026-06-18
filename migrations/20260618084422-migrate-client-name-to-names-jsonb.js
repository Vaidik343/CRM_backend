'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add names column
    await queryInterface.addColumn('clients', 'names', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });

    // Copy old name into names array
    await queryInterface.sequelize.query(`
      UPDATE clients
      SET names = jsonb_build_array(name)
      WHERE name IS NOT NULL
    `);

    // Remove old name column
    await queryInterface.removeColumn('clients', 'name');

    // Make phone unique
    await queryInterface.changeColumn('clients', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Restore name column
    await queryInterface.addColumn('clients', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });

    // Copy first name back
    await queryInterface.sequelize.query(`
      UPDATE clients
      SET name = COALESCE(names->>0, '')
    `);

    // Remove names column
    await queryInterface.removeColumn('clients', 'names');

    // Remove unique constraint
    await queryInterface.changeColumn('clients', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: false,
    });
  },
};