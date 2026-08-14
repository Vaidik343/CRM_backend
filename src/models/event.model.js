module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define("Event", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    event_type: {
      type: DataTypes.ENUM('birthday', 'promotion', 'office', 'trip', 'fun_game'),
      allowNull: false,
    },
    mode: {
      type: DataTypes.ENUM('manual', 'ai'),
      allowNull: false,
      defaultValue: 'manual',
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    employee_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    design_template: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ai_prompt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ai_config: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    card_html: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    display_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_announced: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
},
  }, {
    tableName: 'events',
    underscored: true,
    timestamps: true,
  });

 

  return Event;
};