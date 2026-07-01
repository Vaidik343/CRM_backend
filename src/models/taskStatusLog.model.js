module.exports = (sequelize, DataTypes) => {
  const TaskStatusLog = sequelize.define('TaskStatusLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    task_id: { type: DataTypes.UUID, allowNull: false },
    changed_by: { type: DataTypes.UUID, allowNull: false },
    from_status: { type: DataTypes.STRING, allowNull: true },
    to_status: { type: DataTypes.STRING, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'task_status_logs',
    timestamps: false,
  });

  return TaskStatusLog;
};