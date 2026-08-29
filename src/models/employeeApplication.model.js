module.exports = (sequelize, DataTypes) => {
  const EmployeeApplication = sequelize.define(
    'EmployeeApplication',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      display_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      alternate_number: {
  type: DataTypes.STRING,
  allowNull: true,
},


      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      bank_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      account_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ifsc_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      account_holder_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      offer_letter_path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      offer_sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      work_location_type: {
  type: DataTypes.ENUM('in_office', 'out_of_office'),
  allowNull: true,
},
work_location: {
  type: DataTypes.STRING,
  allowNull: true,
},

    },
    {
      tableName: 'employee_applications',
      underscored: true,
      timestamps: true,
    }
  );

  return EmployeeApplication;
};