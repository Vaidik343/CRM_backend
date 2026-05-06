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
        type: DataTypes.UUID,
        allowNull: false, // optional for now
        unique: true,
      },
      name: { type: DataTypes.STRING(120), 
        allowNull: false 
      },

      email: { 
        type: DataTypes.STRING(180), 
        allowNull: false, unique: true
       },
      password: { 
        type: DataTypes.STRING, 
        allowNull: false,
       },
      role_id: {
                type: DataTypes.UUID,
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
