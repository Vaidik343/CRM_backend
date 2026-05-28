module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      // STRING instead of ENUM — easier to extend without new migrations
      // Values: "TASK_ASSIGNED", "TASK_UPDATED", "CALL_TRANSFER",
      //         "PROJECT_ADDED", "TASK_COMMENT", "CALL_FOLLOWUP"
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      // JSON payload — task_id, display_id, project_id, etc.
      data: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },

      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "notifications",
      timestamps: true,
      underscored: true,
    }
  );

  return Notification;
};