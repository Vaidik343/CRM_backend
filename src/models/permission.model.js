
module.exports = (sequelize, DataTypes) => {

  const Permission = sequelize.define(
    'Permission',
    {
       id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
       user_id: {
          type:DataTypes.UUID,
                allowNull: false,
                unique: true
       },
       can_read: {
        type: DataTypes.BOOLEAN,
        defaultValue : true,
        allowNull: false
       },
       can_write : {
        type: DataTypes.BOOLEAN,
                defaultValue : true,
        allowNull: false
       },
       can_update : {
        type: DataTypes.BOOLEAN,
                defaultValue : false,
        allowNull: false
       },
       can_delete : {
        type: DataTypes.BOOLEAN,
                defaultValue : false,
        allowNull: false
       }

    },
     {
      tableName: "permissions",
      timestamps: true,
    },
  )

  return Permission

}