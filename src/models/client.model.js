module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define("Client", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
        names: {
      type: DataTypes.JSONB,
      allowNull: false,
         defaultValue: [], // names[0] = primary/display name
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: "clients",
    timestamps: true,
  });

  return Client;
};