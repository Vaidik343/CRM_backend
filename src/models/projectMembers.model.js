module.exports = (sequelize, DataTypes) => {
  const ProjectMember = sequelize.define('ProjectMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
     is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  }, {
    tableName: 'project_members',
    underscored: true,
    timestamps: true,
    
  });

  return ProjectMember;
};

 