module.exports = (sequelize, DataTypes) => {
  const Teams = sequelize.define(
    "Teams",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      project_id: {
  type: DataTypes.UUID,
  allowNull: false,
},
       name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
       is_active: {
        type:DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: "teams",
      timestamps: true,
    },
  );

  return Teams;
};
