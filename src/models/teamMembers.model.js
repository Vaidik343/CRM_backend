module.exports = (sequelize, DataTypes) => {
  const TeamMember = sequelize.define('TeamMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(
        'Team Lead',
        'Sr. Developer',
        'Developer',
        'Junior Developer',
        'QA',
        'Designer',
        'Project Manager',
        "Intern",
        "Other"
      ),
      allowNull: false,
      defaultValue: 'Developer',
    },

     is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  }, {
    tableName: 'team_members',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['team_id', 'user_id'], // one role per team per user
      },
    ],
  });

  return TeamMember;
};