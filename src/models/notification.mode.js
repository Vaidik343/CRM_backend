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

      type: {
        type: DataTypes.ENUM(
          "TASK_ASSIGNED",
          "TASK_UPDATED",
          "CALL_TRANSFER",
          "PROJECT_ADDED",
          "TASK_COMMENT",
          "CALL_FOLLOWUP"
        ),
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

      data: {
        type: DataTypes.JSONB,
        allowNull: true,
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