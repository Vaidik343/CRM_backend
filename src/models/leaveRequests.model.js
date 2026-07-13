const { BOOLEAN } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const LeaveRequests = sequelize.define(
        'LeaveRequests', {
            id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      display_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
},

         user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    leave_type: {
        type: DataTypes.ENUM('paid', 'unpaid', 'exchange'),
        allowNull: false,
    },
    reason_type : {
        type: DataTypes.ENUM('normal', 'emergency'),
        allowNull: false,
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    duration: {
        type: DataTypes.ENUM(
          'full_day',
          'first_half',
          'second_half'
        ),
        allowNull: false,
    },
    exchange_date : {
        type: DataTypes.DATE,
        allowNull: true,
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false,  
    },
    status: {
        type: DataTypes.ENUM(
          'pending',
          'approved',
          'rejected',
          'cancelled'
        ),
   defaultValue: 'pending',
        allowNull: false
    },
    approved_by: {
        type: DataTypes.UUID,
        allowNull: true, 
    
    },
    approved_at : {
        type: DataTypes.DATE,
        allowNull:true,
    },
    rejection_reason: {
        type: DataTypes.TEXT(700),
        allowNull: true
    },

    worked_saturday_id: {
  type: DataTypes.UUID,
  allowNull: true,  // only populated when leave_type === 'exchange'
},

        }, {
      tableName: "leave_requests",
      timestamps: true,
    },
    )

    return LeaveRequests;
}