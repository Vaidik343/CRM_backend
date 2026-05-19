
module.exports = (sequelize, DataTypes) => {

  const Task = sequelize.define(
    'Task',
    {
       id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      call_id: {
  type: DataTypes.UUID,
  allowNull: true,
},
project_id: {
  type: DataTypes.UUID,
  allowNull: true,
},

      task: {
         type: DataTypes.STRING,
        allowNull: false,
      },
      description : {
         type: DataTypes.STRING,
        allowNull: true,
      },

      team_id: {
  type: DataTypes.UUID,
  allowNull: true, // true during migration; set false after all tasks assigned
},
       assigned_to: {
        type: DataTypes.UUID,
        allowNull: false,
      },
       assigned_by: {
        type: DataTypes.UUID,
        
        allowNull: false,
      },
      start_date: {
         type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
      },
      due_date : {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
       status: {
        type: DataTypes.ENUM("open", "ongoing", "closed"),
        defaultValue: "open",
        allowNull:false
      },

    },
     {
      tableName: "tasks",
      timestamps: true,
    },
  )

  return Task

}