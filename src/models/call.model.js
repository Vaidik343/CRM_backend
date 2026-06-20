

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
        display_id: {
    type: DataTypes.STRING,
    allowNull: true // change it to false
},
client_id: {
  type: DataTypes.UUID,
  allowNull: true,  
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
      receive_type: {
        type: DataTypes.ENUM('call','msg','email','meeting'),
        allowNull:false,
      },

      transfer_to: {
  type: DataTypes.UUID,
  allowNull: true,
},
task_assigned_to: {
  type: DataTypes.UUID,
  allowNull: true,
},
      follow_up: {
        type: DataTypes.UUID,
        allowNull:true // change it to false
      },
      parent_call_id: {
  type: DataTypes.UUID,
  allowNull: true,        // null for original calls, set for follow-up calls
},
      

      
      is_task : {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      },
      attendees: {
  type: DataTypes.JSONB,
  allowNull: true,
  defaultValue: [],
},
      remarks: {
        type: DataTypes.JSONB,
        allowNull:true, // change it to false
        defaultValue: [],

        
      }
      

    },
     {
      tableName: "calls",
      timestamps: true,
    },
  )

  return Call
}