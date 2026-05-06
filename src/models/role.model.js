
module.exports = (sequelize, DataTypes) => {
    const Roles = sequelize.define(
        "Roles",
        {
             id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      
             name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      

        }, {
      tableName: "roles",
      timestamps: true,
    },
    )

    return Roles
}

