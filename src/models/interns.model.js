module.exports = (sequelize, DataTypes) => {
  const Intern = sequelize.define('Intern', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    display_id: {
      type: DataTypes.STRING,
      allowNull: true, // set after approval when enrollment_no is confirmed
    },
    intern_type: {
      type: DataTypes.ENUM('intern', 'trainee'),
      allowNull: false,
    },
    status: {
      // ❌ you forgot this entirely
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'active', 'completed'),
      defaultValue: 'pending',
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    mobile: {
      type: DataTypes.STRING, // ❌ not INTEGER — mobile numbers have leading zeros and can be 10+ digits
      allowNull: false,
    },
    enrollment_no: {
      type: DataTypes.STRING, // ❌ not INTEGER — enrollment numbers often have letters e.g. "GTU/2021/001"
      allowNull: false,
      unique: true,
    },
    college_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    degree_type: {
      type: DataTypes.ENUM('bachelor', 'master'),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true, // ❌ should be nullable — admin sets this on approval, not at registration
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true, // ❌ same reason
    },
    mentor_id: {
      type: DataTypes.UUID,
      allowNull: true, // admin sets on approval
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    approved_at: {
      // ❌ you forgot this
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    setup_token: {
  type: DataTypes.STRING,
  allowNull: true,
},
setup_token_expires_at: {
  type: DataTypes.DATE,
  allowNull: true,
},

    password_hash: {
      type: DataTypes.STRING,
      allowNull: true, // ❌ not false — password is set after approval, not at registration
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true, // ❌ not false — they haven't logged in yet at registration
    },
  }, {
    tableName: 'interns',
    timestamps: true, // ❌ you had false — we need createdAt/updatedAt
  });

  return Intern;
};