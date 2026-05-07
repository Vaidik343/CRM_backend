'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('calls', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      caller_name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      caller_number: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      call_type: {
        type: Sequelize.ENUM('inquiry', 'request', 'complaint'),
        allowNull: false,
      },
      call_subtype: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      call_summary: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      receive_type: {
        type: Sequelize.ENUM('call', 'msg', 'email', 'meeting'),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('calls');
    // Drop ENUMs manually in Postgres
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_calls_call_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_calls_receive_type";');
  },
};