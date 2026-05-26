module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define(
        'Notification',
        {
id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    type: {
        type:
                allowNull:true // change it to false
    },
    title: {
        type:DataTypes.STRING,
                allowNull:false // change it to false
    },
    notification_message: {
        type:DataTypes.TEXT,
                allowNull:true // change it to false
    },
    data: {
        type:DataTypes.JSON,
                allowNull:false
    },
    is_read: {
        type:DataTypes.BOOLEAN,
        allowNull:true
    },

        }, {
      tableName: "notification",
      timestamps: true,
    },
    )

    return Notification

}