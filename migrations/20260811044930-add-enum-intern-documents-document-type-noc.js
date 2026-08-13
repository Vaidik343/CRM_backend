'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_intern_documents_document_type" ADD VALUE IF NOT EXISTS 'noc';`,
        { transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down() {
    // Postgres ENUM values cannot be removed — no-op
  },
};