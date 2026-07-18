module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define(
    "Users",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.STRING,
        allowNull: false, 
        unique: true,
      },
            role_id: {
                type: DataTypes.UUID,
        allowNull: false,
      },
      name: { type: DataTypes.STRING(120), 
        allowNull: false 
      },

      email: { 
        type: DataTypes.STRING(180), 
        allowNull: false, unique: true
       },
       mobile: {
         type: DataTypes.STRING(20),
         allowNull: true
       },
      password: { 
        type: DataTypes.STRING, 
        allowNull: false,
       },
saturday_group: {
  type: DataTypes.ENUM('A', 'B'),
  allowNull: true,  // null = not applicable (e.g. admin/management)
},

is_probation: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  allowNull: true
},

  probation_start: {
      type: DataTypes.DATEONLY,
      allowNull: true, // ❌ should be nullable — admin sets this on approval, not at registration
    },
    probation_end: {
      type: DataTypes.DATEONLY,
      allowNull: true, // ❌ same reason
    },

       probation_status: {
      type: DataTypes.ENUM('active', 'passed', 'terminated'),
      defaultValue: 'active',
      allowNull: true,
    },
      is_admin: {
        type: DataTypes.BOOLEAN,
        allowNull:false
      }
    },
    
    {
      tableName: "users",
      timestamps: true,
    },
  );

  return Users;
};
