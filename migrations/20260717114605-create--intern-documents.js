'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('intern_documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      intern_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'interns', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      document_type: {
        type: Sequelize.ENUM('aadhaar', 'voter_card', 'passport', 'driving_licence'),
        allowNull: false,
      },
      id_proof: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      photo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      college_detail: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      resume: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      last_sem_marksheet: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('intern_documents');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_intern_documents_document_type";
    `);
  },
};