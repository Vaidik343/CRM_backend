"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    const table = await queryInterface.describeTable("calls");

    if (!table.transfer_to) {
      await queryInterface.addColumn("calls", "transfer_to", {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }

    if (!table.task_assigned_to) {
      await queryInterface.addColumn("calls", "task_assigned_to", {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }

    if (!table.parent_call_id) {
      await queryInterface.addColumn("calls", "parent_call_id", {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }

    if (!table.follow_up) {
      await queryInterface.addColumn("calls", "follow_up", {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }

    if (!table.is_task) {
      await queryInterface.addColumn("calls", "is_task", {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      });
    }

    if (!table.remarks) {
      await queryInterface.addColumn("calls", "remarks", {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      });
    }

    if (!table.display_id) {
      await queryInterface.addColumn("calls", "display_id", {
        type: Sequelize.STRING,
        allowNull: true,

      });
    }
  },

  async down(queryInterface) {

    const table = await queryInterface.describeTable("calls");

    if (table.transfer_to) {
      await queryInterface.removeColumn("calls", "transfer_to");
    }

    if (table.task_assigned_to) {
      await queryInterface.removeColumn("calls", "task_assigned_to");
    }

    if (table.parent_call_id) {
      await queryInterface.removeColumn("calls", "parent_call_id");
    }

    if (table.follow_up) {
      await queryInterface.removeColumn("calls", "follow_up");
    }

    if (table.is_task) {
      await queryInterface.removeColumn("calls", "is_task");
    }

    if (table.remarks) {
      await queryInterface.removeColumn("calls", "remarks");
    }
    if (table.display_id) {
      await queryInterface.removeColumn("calls", "display_id");
    }
  },
};