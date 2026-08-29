'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {

      // ── worked_saturdays: add source + exchange_for_date + nullable marked_by ──

      await queryInterface.addColumn(
        'worked_saturdays',
        'source',
        {
          type: Sequelize.ENUM('admin', 'employee'),
          allowNull: false,
          defaultValue: 'admin',
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'worked_saturdays',
        'exchange_for_date',
        {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        { transaction }
      );

      // marked_by was NOT NULL before — make it nullable for employee-declared records
      await queryInterface.changeColumn(
        'worked_saturdays',
        'marked_by',
        {
          type: Sequelize.UUID,
          allowNull: true,
        },
        { transaction }
      );

      // ── leave_requests: remove unused exchange_date, add exchange_with_date ──

      // only drop if the column actually exists (safe for live DB)
      const tableDesc = await queryInterface.describeTable('leave_requests');

      if (tableDesc.exchange_date) {
        await queryInterface.removeColumn('leave_requests', 'exchange_date', { transaction });
      }

      await queryInterface.addColumn(
        'leave_requests',
        'exchange_with_date',
        {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {

      // ── reverse leave_requests changes ──
      await queryInterface.removeColumn('leave_requests', 'exchange_with_date', { transaction });

      // restore exchange_date (nullable — we don't know original data)
      await queryInterface.addColumn(
        'leave_requests',
        'exchange_date',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );

      // ── reverse worked_saturdays changes ──
      await queryInterface.removeColumn('worked_saturdays', 'exchange_for_date', { transaction });
      await queryInterface.removeColumn('worked_saturdays', 'source', { transaction });

      // drop the ENUM type PostgreSQL creates
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_worked_saturdays_source";',
        { transaction }
      );

      // restore marked_by as NOT NULL — only safe if all rows have a value
      // if unsure, leave this commented out and handle manually
      await queryInterface.changeColumn(
        'worked_saturdays',
        'marked_by',
        {
          type: Sequelize.UUID,
          allowNull: false,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};