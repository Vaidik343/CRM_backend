module.exports = (sequelize, DataTypes) => {
  const PublicHoliday = sequelize.define('PublicHoliday', {
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'public_holidays',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['date'],  // no duplicate holiday on same date
      }
    ]
  });

  return PublicHoliday;
};