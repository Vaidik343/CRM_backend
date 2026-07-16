module.exports = (sequelize, DataTypes) => {
  const LeaveBalance = sequelize.define('LeaveBalance', {
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
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    entitled_paid: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 2,
      allowNull: false,
    },
    used_paid: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 0,
      allowNull: false,
    },
    used_unpaid: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 0,
      allowNull: false,
    },
    used_exchange: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 0,
      allowNull: false,
    },
  }, {
    tableName: 'leave_balances',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'month', 'year'],
      }
    ]
  });

  return LeaveBalance;
};