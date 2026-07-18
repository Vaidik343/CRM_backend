module.exports = (sequelize, DataTypes) => {
  const InternProject = sequelize.define('InternProject', {
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
    intern_id: { // ❌ you had 'inter_id' — typo
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tech_details: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},  // ❌ should be {} not [] — it's an object with keys like languages, frameworks etc.
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mentor_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'intern_projects',
    timestamps: true, // ❌ you had false
  });

  return InternProject;
};