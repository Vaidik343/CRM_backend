'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('calls', 'client_id', {
      type: Sequelize.UUID,
      allowNull: true,

      references: {
        model: 'clients',
        key: 'id',
      },

      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('calls', 'client_id');
  },
};