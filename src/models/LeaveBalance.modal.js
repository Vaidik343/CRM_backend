module.exports = (sequelize, DataTypes) => {
  const LeaveBalance = sequelize.define('LeaveBalance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    month: {
      type: DataTypes.INTEGER,  // 1–12
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    entitled_paid:    { type: DataTypes.INTEGER, defaultValue: 2 },  // always 2 for now
    used_paid:        { type: DataTypes.INTEGER, defaultValue: 0 },
    used_unpaid:      { type: DataTypes.INTEGER, defaultValue: 0 },
    used_exchange:    { type: DataTypes.INTEGER, defaultValue: 0 },
    // remaining_paid is always: entitled_paid - used_paid (can derive, no need to store)
  }, {
    tableName: 'leave_balances',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'month', 'year'],  // one record per employee per month
      }
    ]
  });

  return LeaveBalance;
};