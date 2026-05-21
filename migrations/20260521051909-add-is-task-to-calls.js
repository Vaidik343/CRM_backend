'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('calls', 'is_task', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('calls', 'is_task');

  },
};