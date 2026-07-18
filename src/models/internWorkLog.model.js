module.exports = (sequelize, DataTypes) => {
  const InternWorkLog = sequelize.define('InternWorkLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    display_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    intern_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    intern_project_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    intern_task_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    hours: {
      type: DataTypes.DECIMAL(4, 1), // e.g. 2.5 hours
      allowNull: false,
    },
    log_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  }, {
    tableName: 'intern_worklogs',
    timestamps: true,
  });

  return InternWorkLog;
};