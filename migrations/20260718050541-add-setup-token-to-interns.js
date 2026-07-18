'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('interns', 'setup_token', {
      type: Sequelize.STRING,
      allowNull: true, // set when admin approves, cleared after password is set
    });
    await queryInterface.addColumn('interns', 'setup_token_expires_at', {
      type: Sequelize.DATE,
      allowNull: true, // token expires in 24 hours
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('interns', 'setup_token');
    await queryInterface.removeColumn('interns', 'setup_token_expires_at');
  },
};