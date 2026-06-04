module.exports = (sequelize, DataTypes) => {
  const WorkLog = sequelize.define(
    "WorkLog",
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
      project_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    
      description: { type: DataTypes.TEXT, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },


         remarks: {
        type: DataTypes.JSONB,
        allowNull:false, // change it to false
                  defaultValue: [],
        
      } ,

 
    },
    {
      tableName: "work_logs",
      timestamps: true,
        underscored: true
    },
  );

  return WorkLog;
};
