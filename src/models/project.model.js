
module.exports = (sequelize, DataTypes) => {
    const Projects = sequelize.define(
        'Projects', {
             id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

//       team_id: {
//   type: DataTypes.UUID,
//   allowNull: true, 
// },
       name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code : {
         type:DataTypes.STRING,
          unique: true,
         allowNull: true // change it to false
      },
       description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    
      project_type: {
        type: DataTypes.ENUM("web", "mobile", "desktop"),
        allowNull: true, // change it to false
      },
      project_subtype: {
        type: DataTypes.STRING,
        allowNull: true // change to false
      },
      tech_details: {
  type: DataTypes.JSONB,
  allowNull: true,
  defaultValue: [],
},

      development_status: {
        type:DataTypes.ENUM(
  "planning",
  "active",
  "on_hold",
  "testing",
  "completed"
),
        allowNull: true // change it to false
      },
      // created_by: {
      //     type:DataTypes.UUID,
      //           allowNull: false
      // },
      is_active: {
        type:DataTypes.BOOLEAN,
        defaultValue: true
      },
         remarks: {
        type: DataTypes.JSONB,
        allowNull:true // change it to false
        
      }
      
        }, {
      tableName: "projects",
      timestamps: true,
    },
    )

    return Projects

}