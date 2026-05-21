

module.exports = (sequelize, DataTypes) => {

  const Call = sequelize.define(
    "Call",
    {
       id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
          type:DataTypes.UUID,
                allowNull: false
      },
      caller_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      caller_number: {
        type: DataTypes.STRING,
        allowNull: true
      },
      project_id: {
          type:DataTypes.UUID,
                allowNull: true
      },
      call_type: {
        type: DataTypes.ENUM("inquiry", "request", "complaint"),
        allowNull:false
      },
      call_subtype: {
        type: DataTypes.STRING,
        allowNull:false,
      },
      call_summary: {
        type: DataTypes.TEXT,
        allowNull:true,
      },
      remarks: {
        type: DataTypes.STRING,
        allowNull:true,
      },
      receive_type: {
        type: DataTypes.ENUM('call','msg','email','meeting'),
        allowNull:false,
      },
      is_task : {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      }

    },
     {
      tableName: "calls",
      timestamps: true,
    },
  )

  return Call
}