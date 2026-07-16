'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_balances', {
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
        onDelete: 'CASCADE',
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      entitled_paid: {
        type: Sequelize.DECIMAL(4, 1),
        defaultValue: 2,
        allowNull: false,
      },
      used_paid: {
        type: Sequelize.DECIMAL(4, 1),
        defaultValue: 0,
        allowNull: false,
      },
      used_unpaid: {
        type: Sequelize.DECIMAL(4, 1),
        defaultValue: 0,
        allowNull: false,
      },
      used_exchange: {
        type: Sequelize.DECIMAL(4, 1),
        defaultValue: 0,
        allowNull: false,
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

    await queryInterface.addIndex('leave_balances', ['user_id', 'month', 'year'], {
      unique: true,
      name: 'leave_balances_user_month_year_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('leave_balances');
  },
};