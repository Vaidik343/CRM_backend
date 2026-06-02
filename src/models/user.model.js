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
