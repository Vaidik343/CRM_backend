'use strict';

module.exports = {
  async up(queryInterface, DataTypes) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'events',
        {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
          },

          event_type: {
            type: DataTypes.ENUM(
              'birthday',
              'promotion',
              'office',
              'trip',
              'fun_game'
            ),
            allowNull: false,
          },

          mode: {
            type: DataTypes.ENUM('manual', 'ai'),
            allowNull: false,
            defaultValue: 'manual',
          },

          created_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
          },

          employee_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
          },

          employee_name: {
            type: DataTypes.STRING,
            allowNull: false,
          },

          message: {
            type: DataTypes.TEXT,
            allowNull: true,
          },

          design_template: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          ai_prompt: {
            type: DataTypes.TEXT,
            allowNull: true,
          },

          ai_config: {
            type: DataTypes.JSONB,
            defaultValue: {},
          },

          event_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
          },

          card_html: {
            type: DataTypes.TEXT,
            allowNull: true,
          },

          is_published: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
          },

          display_id: {
            type: DataTypes.STRING,
            allowNull: true,
          },

          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },

          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
        },
        {
          transaction,
        }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('events', {
        transaction,
      });

      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_events_event_type";',
        { transaction }
      );

      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_events_mode";',
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};