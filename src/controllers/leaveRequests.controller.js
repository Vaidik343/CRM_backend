const {
  LeaveRequest,
  User,
  LeaveLog,
  CompanySettings,
  WorkedSaturday,
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

// const leaveIncludes = [
//   {
//     model: User,
//     as: "employee",
//     attributes: ["id", "name", "employee_id"],
//   },
//   {
//     model: User,
//     as: "approver",
//     attributes: ["id", "name", "employee_id"],
//   },
//   {
//     model: LeaveLog,
//     as: "logs",
//     attributes: ["id"],
//   },
//   {
//     model: LeaveLog,
//     as: "leaveRequest",
//     attributes: ["id"],
//   },
//   {
//     model: LeaveLog,
//     as: "leaveRequest",
// }
// ];


const employeeInclude = {
  model: User,
  as: 'employee',
  attributes: ['id', 'name', 'employee_id'],
};

const approverInclude = {
  model: User,
  as: 'approver',
  attributes: ['id', 'name', 'employee_id'],
};

const logsInclude = {
  model: LeaveLog,
  as: 'logs',
  include: [
    {
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'employee_id'],
    },
  ],
  order: [['created_at', 'ASC']],
};



const createLeave = async (req, res) => {
  const t = await sequelize.transaction();
  const io = req.app.get("io");

  try {
    const {

  leave_type,
      reason_type,
      start_date,
      end_date,
      duration,
      worked_saturday_id,
      reason,
    } = req.body;

const user_id = req.user.id;

      if (!leave_type || !reason_type || !start_date || !end_date || !duration || !reason) {
      await t.rollback();
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

       if (!Object.values(LEAVE_TYPES).includes(leave_type)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid leave type.' });
    }

    if (!Object.values(LEAVE_REASONS).includes(reason_type)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid reason type.' });
    }

    if (!Object.values(LEAVE_DURATION).includes(duration)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid duration.' });
    }


    // ── 2. Half day must be single day ──
    if (
      (duration === LEAVE_DURATION.FIRST_HALF || duration === LEAVE_DURATION.SECOND_HALF) &&
      new Date(start_date).toDateString() !== new Date(end_date).toDateString()
    ) {
      await t.rollback();
      return res.status(400).json({ message: 'Half day leave must be a single day (start and end date must be the same).' });
    }


    // ── 3. Date validation ──
    validateLeaveDates({ start_date, end_date });

    // ── 4. Duplicate/overlap check ──
    await validateDuplicateLeave({ user_id, start_date, end_date });

    // ── 5. Notice period (skip for emergency) ──
    await validateNoticePeriod({ reason_type, duration, start_date });

    // ── 6. Exchange validation ──
    await validateExchangeLeave({ leave_type, worked_saturday_id, user_id });


    // ── 7. Generate display_id ──
    const employee = await User.findByPk(user_id, {
      attributes: ['id', 'employee_id'],
    });

    const display_id = generateDisplayId({
      prefix: 'LV',
      employeeId: employee.employee_id,
    });
    // create leave

    const leave = await LeaveRequest.create({
     user_id,
      display_id,
      leave_type,
      reason_type,
      start_date,
      end_date,
      duration,
       worked_saturday_id: leave_type === LEAVE_TYPES.EXCHANGE ? worked_saturday_id : null,
      reason,
      status: LEAVE_STATUS.PENDING,
    }, { transaction: t });
    console.log("🚀 ~ createLeave ~ leave:", leave)


      // ── 9. Mark Saturday as exchanged ──
    if (leave_type === LEAVE_TYPES.EXCHANGE) {
      await WorkedSaturday.update(
        { is_exchanged: true },
        {
          where: { id: worked_saturday_id, user_id },
          transaction: t,
        }
      );
    }


     // ── 10. Create leave log ──
  await LeaveLog.create({
      leave_request_id: leave.id,
      user_id,
      action: 'created',
      remarks: {
        leave_type,
        reason_type,
        duration,
        start_date,
        end_date,
      },
    }, { transaction: t });

    await t.commit();

    return res.status(201).json({
      message: 'Leave request submitted successfully.',
      leave,
    });


  } catch (error) {
     await t.rollback();
    return res.status(400).json({ message: error.message });
  }
};


// employee side - myemp

const getMyLeaves = async (req, res) => {
  try {
    const user_id = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { status, leave_type, from, to, search } = req.query;

    const where = { user_id };

    if (status) where.status = status;
    if (leave_type) where.leave_type = leave_type;

    if (from || to) {
      where.start_date = {};
      if (from) where.start_date[Op.gte] = new Date(from);
      if (to)   where.start_date[Op.lte] = new Date(to);
    }

    if (search) {
      where.display_id = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await LeaveRequest.findAndCountAll({
      where,
      include: [approverInclude, logsInclude],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      leaves: rows,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// emp - cancel leave

const cancelLeave = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const user_id = req.user.id;
    const {id} = req.params;

    const leave = await LeaveRequest.findOne({
      where: {id, user_id},
    });

    if(!leave)
    {
      await t.rollback();
       return res.status(404).json({ message: 'Leave request not found.' });
    }


    if (leave.status !== LEAVE_STATUS.PENDING) {
      await t.rollback();
      return res.status(400).json({ message: 'Only pending leave requests can be cancelled.' });
    }

     await leave.update({ status: LEAVE_STATUS.CANCELLED }, { transaction: t });

      // Free up the Saturday if it was an exchange leave
    if (leave.leave_type === LEAVE_TYPES.EXCHANGE && leave.worked_saturday_id) {
      await WorkedSaturday.update(
        { is_exchanged: false },
        {
          where: { id: leave.worked_saturday_id, user_id },
          transaction: t,
        }
      );
    }

    await LeaveLog.create({
      leave_request_id: leave.id,
      user_id,
      action: 'cancelled',
      remarks: { cancelled_by: 'employee' },
    }, { transaction: t });

    await t.commit();

    return res.status(200).json({ message: 'Leave request cancelled.' });

  } catch (error) {
     await t.rollback();
    return res.status(500).json({ message: err.message });
  }
}

const getAllLeaves = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1 ) * limit;

    const {status, leave_type, from, to , search, user_id} = req.query;

    const where = {};


    if (status)     where.status = status;
    if (leave_type) where.leave_type = leave_type;
    if (user_id)    where.user_id = user_id;

    if (from || to) {
      where.start_date = {};
      if (from) where.start_date[Op.gte] = new Date(from);
      if (to)   where.start_date[Op.lte] = new Date(to);
    }

    const employeeWhere = {};
    if (search) {
      employeeWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { employee_id: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await LeaveRequest.findAndCountAll({
      where,
      include: [
        { ...employeeInclude, where: Object.keys(employeeWhere).length ? employeeWhere : undefined },
        approverInclude,
        logsInclude,
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    return res.status(200).json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      leaves: rows,
    });
  } catch (error) {
     return res.status(500).json({ message: err.message });
  }
}

// ─────────────────────────────────────────────
// ADMIN — Approve Leave
// ─────────────────────────────────────────────

const approveLeave = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const admin_id = req.user.id;
    const { id } = req.params;

    const leave = await LeaveRequest.findByPk(id);

    if (!leave) {
      await t.rollback();
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    if (leave.status !== LEAVE_STATUS.PENDING) {
      await t.rollback();
      return res.status(400).json({ message: `Leave is already ${leave.status}.` });
    }

    await leave.update({
      status: LEAVE_STATUS.APPROVED,
      approved_by: admin_id,
      approved_at: new Date(),
    }, { transaction: t });

    await LeaveLog.create({
      leave_request_id: leave.id,
      user_id: admin_id,
      action: 'approved',
      remarks: {},
    }, { transaction: t });

    await t.commit();

    return res.status(200).json({ message: 'Leave request approved.' });

  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Reject Leave
// ─────────────────────────────────────────────

const rejectLeave = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const admin_id = req.user.id;
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || !rejection_reason.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Rejection reason is required.' });
    }

    const leave = await LeaveRequest.findByPk(id);

    if (!leave) {
      await t.rollback();
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    if (leave.status !== LEAVE_STATUS.PENDING) {
      await t.rollback();
      return res.status(400).json({ message: `Leave is already ${leave.status}.` });
    }

    await leave.update({
      status: LEAVE_STATUS.REJECTED,
      approved_by: admin_id,
      approved_at: new Date(),
      rejection_reason: rejection_reason.trim(),
    }, { transaction: t });

    // Free up the Saturday if exchange leave is rejected
    if (leave.leave_type === LEAVE_TYPES.EXCHANGE && leave.worked_saturday_id) {
      await WorkedSaturday.update(
        { is_exchanged: false },
        { where: { id: leave.worked_saturday_id }, transaction: t }
      );
    }

    await LeaveLog.create({
      leave_request_id: leave.id,
      user_id: admin_id,
      action: 'rejected',
      remarks: { rejection_reason: rejection_reason.trim() },
    }, { transaction: t });

    await t.commit();

    return res.status(200).json({ message: 'Leave request rejected.' });

  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Mark Worked Saturday
// ─────────────────────────────────────────────

const markWorkedSaturday = async (req, res) => {
  try {
    const admin_id = req.user.id;
    const { user_id, saturday_date } = req.body;

    if (!user_id || !saturday_date) {
      return res.status(400).json({ message: 'user_id and saturday_date are required.' });
    }

    const date = new Date(saturday_date);

    if (isNaN(date)) {
      return res.status(400).json({ message: 'Invalid saturday_date.' });
    }

    if (date.getDay() !== 6) {
      return res.status(400).json({ message: 'Provided date is not a Saturday.' });
    }

    // Prevent duplicate entry for same employee + same date
    const existing = await WorkedSaturday.findOne({
      where: { user_id, saturday_date },
    });

    if (existing) {
      return res.status(409).json({ message: 'This Saturday is already marked as worked for this employee.' });
    }

    const record = await WorkedSaturday.create({
      user_id,
      saturday_date,
      is_exchanged: false,
      marked_by: admin_id,
    });

    return res.status(201).json({
      message: 'Saturday marked as worked.',
      record,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Get Available Saturdays for Employee
// ─────────────────────────────────────────────

const getWorkedSaturdays = async (req, res) => {
  try {
    const { user_id } = req.params;

    const saturdays = await WorkedSaturday.findAll({
      where: {
        user_id,
        is_exchanged: false,
      },
      order: [['saturday_date', 'ASC']],
    });

    return res.status(200).json({ saturdays });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────────
// GET LEAVE LOGS — Admin + Employee (own only)
// ─────────────────────────────────────────────

const getLeaveLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const isAdmin = req.user.is_admin ; 

    // First find the leave request
    const leave = await LeaveRequest.findByPk(id, {
      attributes: ['id', 'user_id', 'display_id'],
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    // Employee can only see logs of their own leave
    if (!isAdmin && leave.user_id !== user_id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const logs = await LeaveLog.findAll({
      where: { leave_request_id: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'employee_id'],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    return res.status(200).json({ logs });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────────

module.exports.leaveController = {
  createLeave,
  getMyLeaves,
  cancelLeave,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  markWorkedSaturday,
  getWorkedSaturdays,
  getLeaveLogs
}