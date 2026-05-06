module.exports = (sequelize, DataTypes) => {
  const WorkLog = sequelize.define(
    "WorkLog",
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
      description: { type: DataTypes.TEXT, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
    },
    {
      tableName: "work_logs",
      timestamps: true,
    },
  );

  return WorkLog;
};
