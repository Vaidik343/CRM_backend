module.exports = (sequelize, DataTypes) => {
  const InternTask = sequelize.define('InternTask', {
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
      allowNull: true, // optional — task may not be linked to a project
    },
    task: {
      // ❌ you forgot the actual task name/title field
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assigned_by: {
      type: DataTypes.UUID,
      allowNull: true, // null = self created by intern
    },
    status: {
      type: DataTypes.ENUM('open', 'ongoing', 'hold', 'closed'),
      defaultValue: 'open',
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    remarks: {
      // same JSONB remarks pattern as employee tasks
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'intern_tasks',
    timestamps: true,
  });

  return InternTask;
};