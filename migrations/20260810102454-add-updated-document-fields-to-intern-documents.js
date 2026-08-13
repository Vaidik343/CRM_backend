'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('intern_documents', 'updated_id_proof', {
        type:      Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }, { transaction });

      await queryInterface.addColumn('intern_documents', 'updated_photo', {
        type:      Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }, { transaction });

      await queryInterface.addColumn('intern_documents', 'updated_resume', {
        type:      Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }, { transaction });

      await queryInterface.addColumn('intern_documents', 'updated_last_sem_marksheet', {
        type:      Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('intern_documents', 'updated_id_proof',           { transaction });
      await queryInterface.removeColumn('intern_documents', 'updated_photo',              { transaction });
      await queryInterface.removeColumn('intern_documents', 'updated_resume',             { transaction });
      await queryInterface.removeColumn('intern_documents', 'updated_last_sem_marksheet', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};