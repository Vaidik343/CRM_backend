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
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    is_exchanged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    marked_by: {
      type: DataTypes.UUID,
      allowNull: true,  // ← changed to true — employee-declared records have no admin
    },
    source: {
      type: DataTypes.ENUM('admin', 'employee'),
      allowNull: false,
      defaultValue: 'admin',
    },
    exchange_for_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,  // only set for employee-declared records
    },
  }, {
    tableName: 'worked_saturdays',
    timestamps: true,
    underscored: true,  // ← added — stays consistent with rest of models
  });
  return WorkedSaturday;
};