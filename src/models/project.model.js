
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
      code : {
         type:DataTypes.STRING,
          unique: true,
         allowNull: true // change it to false
      },
       description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    
       project_types: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },


      // project_type: {
      //   type: DataTypes.ENUM("web", "app", "desktop"),
      //   allowNull: true, // change it to false
      // },
      // project_subtype: {
      //   type: DataTypes.STRING,
      //   allowNull: true // change to false
      // },
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
        allowNull: false ,// change it to false
           defaultValue: "active",
      },
    
      is_active: {
        type:DataTypes.BOOLEAN,
        defaultValue: true
      },

      created_by: {
        type: DataTypes.UUID,
        allowNull: true, // change to false after go-live
      },
         remarks: {
        type: DataTypes.JSONB,
        allowNull:true, // change it to false
        defaultValue: [],
         get() {
    const val = this.getDataValue("remarks");
    if (!val) return [];
    if (typeof val === "string") {
      try { return JSON.parse(val); } catch { return []; }
    }
    return val;
  }
        
      }
      
        }, {
      tableName: "projects",
      timestamps: true,
    },
    )

    return Projects

}