
module.exports = (sequelize, DataTypes) => {
    const Projects = sequelize.define(
        'Projects', {
             id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
       name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
       description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
       remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      created_by: {
          type:DataTypes.UUID,
                allowNull: false
      },
      is_active: {
        type:DataTypes.BOOLEAN,
        defaultValue: true
      }
      
        }, {
      tableName: "projects",
      timestamps: true,
    },
    )

    return Projects

}