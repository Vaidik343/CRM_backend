module.exports = (sequelize, DataTypes) => {
  const WorkedSaturday = sequelize.define('WorkedSaturday', {
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
    saturday_date: {
      type: DataTypes.DATEONLY,  // just the date, no time needed
      allowNull: false,
    },
    is_exchanged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,       // true = already used in an exchange leave
      allowNull: false,
    },
    marked_by: {
      type: DataTypes.UUID,      // admin who marked it
      allowNull: false,
    },
  }, {
    tableName: 'worked_saturdays',
    timestamps: true,
  });

  return WorkedSaturday;
};