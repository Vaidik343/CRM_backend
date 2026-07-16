const {
  LeaveRequest,
  User,
  LeaveLog,
  CompanySettings,
  WorkedSaturday,
   LeaveBalance,       
  PublicHoliday,   
  sequelize,
} = require("../models");
const generateDisplayId = require("../utils/generateDisplayId");
const generateProjectCode = require("../utils/generateProjectCode");
const { appendRemark } = require("../utils/remarksLog");

const { Op } = require("sequelize");

const {
  validateLeaveDates,
  validateDuplicateLeave,
  validateNoticePeriod,
  validateExchangeLeave,
} = require('../utils/leaveValidation');

const {
  LEAVE_TYPES,
  LEAVE_REASONS,
  LEAVE_DURATION,
  LEAVE_STATUS,
} = require("../constants/leaveConstants");



// ─────────────────────────────────────────────
// GET BALANCE — Employee (own current month)
// ─────────────────────────────────────────────

const getMyBalance = async (req, res) => {
  try {
    const user_id = req.user.id;
    const now     = new Date();
    const month   = now.getMonth() + 1;
    const year    = now.getFullYear();

    const balance = await LeaveBalance.findOne({
      where: { user_id, month, year },
    });
    console.log("🚀 ~ getMyBalance ~ balance:", balance)

    // if no record yet this month — return default entitlement
    if (!balance) {
      return res.status(200).json({
        balance: {
          user_id,
          month,
          year,
          entitled_paid:  2,
          used_paid:      0,
          used_unpaid:    0,
          used_exchange:  0,
          remaining_paid: 2,
        },
      });
    }

    return res.status(200).json({
      balance: {
        ...balance.toJSON(),
        remaining_paid: parseFloat(balance.entitled_paid) - parseFloat(balance.used_paid),
      },
    });

  } catch (err) {
    
  console.log("🚀 ~ getMyBalance ~ err:", err)
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET BALANCE — Admin (any employee, any month)
// ─────────────────────────────────────────────

const getEmployeeBalance = async (req, res) => {
  try {
    const { user_id } = req.params;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const balance = await LeaveBalance.findOne({
      where: { user_id, month, year },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'employee_id'],
        },
      ],
    });

    if (!balance) {
      return res.status(200).json({
        balance: {
          user_id,
          month,
          year,
          entitled_paid:  2,
          used_paid:      0,
          used_unpaid:    0,
          used_exchange:  0,
          remaining_paid: 2,
        },
      });
    }

    return res.status(200).json({
      balance: {
        ...balance.toJSON(),
        remaining_paid: parseFloat(balance.entitled_paid) - parseFloat(balance.used_paid),
      },
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET BALANCE HISTORY — Admin (all months for employee)
// ─────────────────────────────────────────────

const getEmployeeBalanceHistory = async (req, res) => {
  try {
    const { user_id } = req.params;

    const history = await LeaveBalance.findAll({
      where: { user_id },
      order: [['year', 'DESC'], ['month', 'DESC']],
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'employee_id'],
        },
      ],
    });

    const result = history.map((b) => ({
      ...b.toJSON(),
      remaining_paid: parseFloat(b.entitled_paid) - parseFloat(b.used_paid),
    }));

    return res.status(200).json({ history: result });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────────
// PUBLIC HOLIDAYS — Admin manages
// ─────────────────────────────────────────────

const addPublicHoliday = async (req, res) => {
  try {
    const admin_id    = req.user.id;
    const { name, date } = req.body;

    if (!name || !date) {
      return res.status(400).json({ message: 'name and date are required.' });
    }

    if (isNaN(new Date(date))) {
      return res.status(400).json({ message: 'Invalid date.' });
    }

    const existing = await PublicHoliday.findOne({ where: { date } });
    if (existing) {
      return res.status(409).json({ message: `A holiday already exists on ${date}: ${existing.name}` });
    }

    const holiday = await PublicHoliday.create({
      name:       name.trim(),
      date,
      year:       new Date(date).getFullYear(),
      created_by: admin_id,
    });

    return res.status(201).json({ message: 'Holiday added.', holiday });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getPublicHolidays = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const holidays = await PublicHoliday.findAll({
      where: { year },
      order: [['date', 'ASC']],
    });

    return res.status(200).json({ holidays });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deletePublicHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    const holiday = await PublicHoliday.findByPk(id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found.' });
    }

    await holiday.destroy();
    return res.status(200).json({ message: 'Holiday deleted.' });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


module.exports.leaveBalanceController = {

  getMyBalance,
  getEmployeeBalance,
  getEmployeeBalanceHistory,
  addPublicHoliday,
  getPublicHolidays,
  deletePublicHoliday,
};