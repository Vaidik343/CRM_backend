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

const { moveUploadedFile } = require('../utils/fileUpload');

const { createNotification , notifyAdmins } = require("./notifications.controller");

const { Op } = require("sequelize");

const { sendLeaveRequestEmail, sendLeaveApprovedEmail, sendLeaveRejectedEmail, sendLeaveCancelledEmail, sendDocumentUploadedEmail, sendApprovedLeaveCancelledEmail } = require("../utils/email");

const path = require("path");

const {
  validateLeaveDates,
  validateDuplicateLeave,
  validateNoticePeriod,
  validateExchangeLeave,
  countLeaveDays,
  splitDaysByMonth,
  computeSandwichDays,
  getOffDaysInRange,
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

const exchange_with_date = req.body.exchange_with_date || null;
const exchange_for_date  = req.body.exchange_for_date  || null;

    console.log(req.body);
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
    await validateDuplicateLeave({ user_id, start_date, end_date , duration });

    // ── 5. Notice period (skip for emergency) ──
    await validateNoticePeriod({ reason_type, duration, start_date });

    // ── 6. Exchange validation ──
// ── 6. Exchange validation ──
await validateExchangeLeave({
  leave_type,
  worked_saturday_id,
  exchange_with_date,
  exchange_for_date,
  user_id,
});

console.log("req.file:", req.file);
console.log("req.body:", req.body);
    // ── Emergency sub-type validation ──
let emergency_sub_type = null;

if (reason_type === LEAVE_REASONS.EMERGENCY) {
  const sub = req.body.emergency_sub_type;
  if (!sub || !['medical', 'other'].includes(sub)) {
    await t.rollback();
    return res.status(400).json({
      message: "Emergency leave requires a sub-type: 'medical' or 'other'.",
    });
  }
  // if (!req.file) {
  //   await t.rollback();
  //   return res.status(400).json({
  //     message: "A supporting document is required for emergency leave.",
  //   });
  // }
}

    // ── 7. Generate display_id ──
    const employee = await User.findByPk(user_id, {
      attributes: ['id', 'employee_id',   "name",
    "email",],
    });
console.log(employee.toJSON());
    const display_id = generateDisplayId({
      prefix: 'LV',
      employeeId: employee.employee_id,
    });
    // create leave

   // For self-declared exchange — start/end come from exchange_for_date
const resolvedStartDate = leave_type === LEAVE_TYPES.EXCHANGE && !worked_saturday_id
  ? exchange_for_date
  : start_date;
const resolvedEndDate = leave_type === LEAVE_TYPES.EXCHANGE && !worked_saturday_id
  ? exchange_for_date
  : end_date;

const leave = await LeaveRequest.create({
  user_id,
  display_id,
  leave_type,
  reason_type,
  emergency_sub_type: reason_type === LEAVE_REASONS.EMERGENCY
    ? req.body.emergency_sub_type
    : null,
  medical_document: null,
  start_date:  resolvedStartDate,
  end_date:    resolvedEndDate,
  duration:    'full_day',
  worked_saturday_id: leave_type === LEAVE_TYPES.EXCHANGE && worked_saturday_id
    ? worked_saturday_id
    : null,
  exchange_with_date: leave_type === LEAVE_TYPES.EXCHANGE && !worked_saturday_id
    ? exchange_with_date
    : null,
  reason,
  status: LEAVE_STATUS.PENDING,
}, { transaction: t });

    // ── Medical document upload ──

    let movedDoc = null;


if (req.file) {
  const moved = moveUploadedFile(
    req.file.path,
    `leaves/${leave.id}`,
    'medical_document'
  );

  if (moved) {
      movedDoc = moved;
    await leave.update({ medical_document: moved.url  }, { transaction: t });
  }
}

      // ── 9. Mark Saturday as exchanged ──
 // ── 9. Mark Saturday as exchanged ──
if (leave_type === LEAVE_TYPES.EXCHANGE) {
  if (worked_saturday_id) {
    // Path A — admin-marked: lock it
    await WorkedSaturday.update(
      { is_exchanged: true },
      { where: { id: worked_saturday_id, user_id }, transaction: t }
    );
  } else {
    // Path B — employee self-declared: create record and lock immediately
    await WorkedSaturday.create({
      user_id,
      saturday_date:     exchange_with_date,
      exchange_for_date: exchange_for_date,
      is_exchanged:      true,
      marked_by:         null,
      source:            'employee',
    }, { transaction: t });
  }
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


    
    // ── Notify all admins ──
const admins = await User.findAll({
  where: { is_admin: true },
  attributes: ["id"],
});

     const io = req.app.get("io");


  for (const admin of admins) {
  await createNotification(io, {
    user_id: admin.id,
    type:    "LEAVE_REQUESTED",
    title:   "New Leave Request",
    message: `${employee.name} has submitted a leave request (${display_id}).`,
    data:    { leave_id: leave.id, display_id },
  });
}

    // also emit real-time event to admins room so admin list updates live
io.to("user:admins_room").emit("LEAVE_REQUESTED", leave);



    await t.commit();

res.status(201).json({
  message: "Leave request submitted successfully.",
  leave,
  leave_type: leave.leave_type, 
});

// Fire and forget
sendLeaveRequestEmail({
  employee,
  leave,
    documentPath: movedDoc?.file_path || null,
}).catch(err => {
  console.error("Leave email failed:", err);
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
      data: rows,
    });

  } catch (err) {
    
  console.log("🚀 ~ getMyLeaves ~ err:", err)
    return res.status(500).json({ message: err.message });
  }
};


// emp - cancel leave

const cancelLeave = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    const { reason } = req.body  || {} ; // optional reason for approved leave cancellation

    const leave = await LeaveRequest.findOne({
      where: { id, user_id },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'employee_id', 'email', 'saturday_group'],
        },
      ],
    });
    console.log("🚀 ~ cancelLeave ~ leave:", leave)

    if (!leave) {
      await t.rollback();
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    // ── Pending: simple cancel, no balance impact ──
    if (leave.status === LEAVE_STATUS.PENDING) {
      await leave.update({ status: LEAVE_STATUS.CANCELLED }, { transaction: t });

    if (leave.leave_type === LEAVE_TYPES.EXCHANGE) {
  if (leave.worked_saturday_id) {
    await WorkedSaturday.update(
      { is_exchanged: false },
      { where: { id: leave.worked_saturday_id, user_id }, transaction: t }
    );
  } else if (leave.exchange_with_date) {
    await WorkedSaturday.destroy({
      where: {
        user_id:       leave.user_id,
        saturday_date: leave.exchange_with_date,
        source:        'employee',
      },
      transaction: t,
    });
  }
}

      await LeaveLog.create({
        leave_request_id: leave.id,
        user_id,
        action: 'cancelled',
        remarks: { cancelled_by: 'employee' },
      }, { transaction: t });

      await t.commit();

      const io = req.app.get('io');
      const admins = await User.findAll({ where: { is_admin: true }, attributes: ['id'] });
      for (const admin of admins) {
        await createNotification(io, {
          user_id: admin.id,
          type:    'LEAVE_CANCELLED',
          title:   'Leave Request Cancelled',
          message: `A leave request (${leave.display_id}) has been cancelled by the employee.`,
          data:    { leave_id: leave.id, display_id: leave.display_id },
        });
      }
      io.to('user:admins_room').emit('LEAVE_UPDATED', { id: leave.id, status: 'cancelled' });

      const leaveDays = await countLeaveDays(leave.start_date, leave.end_date, leave.duration);
      sendLeaveCancelledEmail({ employee: leave.employee, leave, leaveDays })
        .catch(err => console.error('Leave cancellation email failed:', err));

      return res.status(200).json({ message: 'Leave request cancelled.' });
    }

    // ── Approved: only allow before start_date ──
    if (leave.status === LEAVE_STATUS.APPROVED) {
      const now = new Date();
      const leaveStart = new Date(leave.start_date);
      // Strip time — compare date only
      now.setHours(0, 0, 0, 0);
      leaveStart.setHours(0, 0, 0, 0);

      if (now >= leaveStart) {
        await t.rollback();
        return res.status(400).json({
          message: 'Approved leave can only be cancelled before the leave start date.',
        });
      }

      // Read approval log for exact bucket breakdown
      const approvalLog = await LeaveLog.findOne({
        where: { leave_request_id: id, action: 'approved' },
        order: [['created_at', 'DESC']],
      });

      const monthBuckets = approvalLog?.remarks?.month_buckets
        || splitDaysByMonth(leave.start_date, leave.end_date, leave.duration);

      for (const bucket of monthBuckets) {
        await _reverseBalanceDeduction({
          user_id:    leave.user_id,
          leave_type: leave.leave_type,
          days:       bucket.days,
          month:      bucket.month,
          year:       bucket.year,
          t,
        });
      }

      const sandwichBuckets = approvalLog?.remarks?.sandwich_buckets || [];
      for (const bucket of sandwichBuckets) {
        if (bucket.days <= 0) continue;
        await _reverseBalanceDeduction({
          user_id:    leave.user_id,
          leave_type: LEAVE_TYPES.UNPAID,
          days:       bucket.days,
          month:      bucket.month,
          year:       bucket.year,
          t,
        });
      }

      if (leave.leave_type === LEAVE_TYPES.EXCHANGE && leave.worked_saturday_id) {
        await WorkedSaturday.update(
          { is_exchanged: false },
          { where: { id: leave.worked_saturday_id }, transaction: t }
        );
      }

      await leave.update({ status: LEAVE_STATUS.CANCELLED }, { transaction: t });

      await LeaveLog.create({
        leave_request_id: leave.id,
        user_id,
        action: 'cancelled',
        remarks: {
          cancelled_by:    'employee',
          was_approved:    true,
          reason:          reason?.trim() || null,
          undone_buckets:  monthBuckets,
          undone_sandwich: sandwichBuckets,
        },
      }, { transaction: t });

      await t.commit();

      const io = req.app.get('io');
      const leaveDays = await countLeaveDays(leave.start_date, leave.end_date, leave.duration);

      // Notify admins — flag that this was an approved leave cancellation
      const admins = await User.findAll({ where: { is_admin: true }, attributes: ['id'] });
      for (const admin of admins) {
        await createNotification(io, {
          user_id: admin.id,
          type:    'LEAVE_CANCELLED',
          title:   'Approved Leave Cancelled by Employee',
          message: `${leave.employee.name} cancelled their approved leave (${leave.display_id}) — balance restored.`,
          data:    { leave_id: leave.id, display_id: leave.display_id },
        });
      }
      io.to('user:admins_room').emit('LEAVE_UPDATED', { id: leave.id, status: 'cancelled' });

    sendLeaveCancelledEmail({ employee: leave.employee, leave, leaveDays })
  .catch(err => console.error('Leave cancellation email (admin) failed:', err));

// Confirm to employee that balance was restored
sendApprovedLeaveCancelledEmail({ employee: leave.employee, leave, leaveDays })
  .catch(err => console.error('Leave cancellation email (employee) failed:', err));

      return res.status(200).json({
        message: 'Approved leave cancelled and balance restored.',
      });
    }

    // Any other status
    await t.rollback();
    return res.status(400).json({
      message: `Leave with status '${leave.status}' cannot be cancelled.`,
    });

  } catch (error) {
    if (t.finished !== 'commit') await t.rollback();
    return res.status(500).json({ message: error.message });
  }
};

  
const getAllLeaves = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { status, leave_type, from, to, search, user_id, month, year } = req.query; // ← add month, year

    const where = {};

    if (status)     where.status     = status;
    if (leave_type) where.leave_type = leave_type;
    if (user_id)    where.user_id    = user_id;

    if (from || to) {
      where.start_date = {};
      if (from) where.start_date[Op.gte] = new Date(from);
      if (to)   where.start_date[Op.lte] = new Date(to);
    }

    // ── Month + Year filter ──
    if (month && year) {
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endOfMonth   = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.start_date   = {
        [Op.gte]: startOfMonth,
        [Op.lte]: endOfMonth,
      };
    } else if (year && !month) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear   = new Date(parseInt(year), 11, 31, 23, 59, 59);
      where.start_date  = {
        [Op.gte]: startOfYear,
        [Op.lte]: endOfYear,
      };
    }

    const employeeWhere = {};
    if (search) {
      employeeWhere[Op.or] = [
        { name:        { [Op.iLike]: `%${search}%` } },
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
      order:    [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    return res.status(200).json({
      total:      count,
      page,
      totalPages: Math.ceil(count / limit),
      data:       rows,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// ─────────────────────────────────────────────
// ADMIN — Approve Leave
// ─────────────────────────────────────────────

const approveLeave = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const admin_id = req.user.id;   
    const { id }   = req.params;

 const approvedBy = await User.findByPk(admin_id, {
  attributes: ['id', 'name'],
});


    // ── 1. Find leave with employee info ──
    const leave = await LeaveRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'employee_id','email', 'saturday_group'],
        },
      ],
    });

    if (!leave) {
      await t.rollback();
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    if (leave.status !== LEAVE_STATUS.PENDING) {
      await t.rollback();
      return res.status(400).json({ message: `Leave is already ${leave.status}.` });
    }

    // Guard against double-charging — check if approval log already exists
const existingApprovalLog = await LeaveLog.findOne({
  where: { leave_request_id: id, action: 'approved' },
});

if (existingApprovalLog) {
  await t.rollback();
  return res.status(400).json({ 
    message: 'This leave has already been processed. Use reverse if correction is needed.' 
  });
}



    // ── 2. Calculate leave days ──
    const leaveDays = await countLeaveDays(
      leave.start_date,
      leave.end_date,
      leave.duration,
      leave.employee.saturday_group,
    );


    // ── 3. Approve the leave ──
    await leave.update({
      status:      LEAVE_STATUS.APPROVED,
      approved_by: admin_id,
      approved_at: new Date(),

    }, { transaction: t });

    // ── 4. Update leave balance ──
  // ── 4. Split leave days by month and update balance ──
    const monthBuckets = splitDaysByMonth(
      leave.start_date,
      leave.end_date,
      leave.duration
    );


    let finalLeaveType = leave.leave_type;

if (leave.leave_type !== LEAVE_TYPES.EXCHANGE) {
  // Read balance BEFORE deduction to determine what this leave will consume
  const firstBucket = monthBuckets[0];
  const existingBalance = await LeaveBalance.findOne({
    where: {
      user_id: leave.user_id,
      month:   firstBucket.month,
      year:    firstBucket.year,
    },
    transaction: t,
  });

  const entitled     = parseFloat(existingBalance?.entitled_paid || 2);
  const usedPaid     = parseFloat(existingBalance?.used_paid     || 0);
  const remainingPaid = entitled - usedPaid;

  finalLeaveType = remainingPaid <= 0
    ? LEAVE_TYPES.UNPAID
    : LEAVE_TYPES.PAID;
}


    for (const bucket of monthBuckets) {
      await _applyBalanceDeduction({
        user_id:    leave.user_id,
        leave_type: leave.leave_type,
        days:       bucket.days,
        month:      bucket.month,
        year:       bucket.year,
        t,
      });
    }

    

    // ── 5. Sandwich day detection ──
    // In approveLeave controller, before calling computeSandwichDays:
const sandwichBuckets = leave.leave_type === LEAVE_TYPES.EXCHANGE
  ? []
  : await computeSandwichDays({
      user_id: leave.user_id,
      newLeave: {
        id:         leave.id,
        start_date: leave.start_date,
        end_date:   leave.end_date,
        duration:   leave.duration,
      },
      saturday_group: leave.employee.saturday_group,
    });
    for (const bucket of sandwichBuckets) {
      if (bucket.days <= 0) continue;
      await _applyBalanceDeduction({
        user_id:    leave.user_id,
        leave_type: LEAVE_TYPES.UNPAID,
        days:       bucket.days,
        month:      bucket.month,
        year:       bucket.year,
        t,
      });
    }

    const totalSandwichDays = sandwichBuckets.reduce((sum, b) => sum + b.days, 0);
// Update leave_type on the record
await leave.update({ leave_type: finalLeaveType }, { transaction: t });
    // ── 6. Leave log ──
  await LeaveLog.create({
      leave_request_id: leave.id,
      user_id:          admin_id,
      action:           'approved',
      remarks: {
        leave_days:       leaveDays,
        month_buckets:    monthBuckets,
        sandwich_days:    totalSandwichDays,
        sandwich_buckets: sandwichBuckets,
      },
    }, { transaction: t });
    // ── 6. Notify employee ──
    const io = req.app.get('io');

    await createNotification(io, {
      user_id: leave.user_id,
      type:    'LEAVE_APPROVED',
      title:   'Leave Request Approved',
      message: `Your leave request (${leave.display_id}) has been approved.`,
      data:    { leave_id: leave.id, display_id: leave.display_id },
    });

    await notifyAdmins(io, {
  type:    'LEAVE_APPROVED',
  title:   'Leave Approved',
    message: `You approved ${leave.employee.name}'s leave request (${leave.display_id}) — ${leaveDays} day(s)${totalSandwichDays > 0 ? ` + ${totalSandwichDays} sandwich day(s)` : ""}.`,
  data:    { leave_id: leave.id, display_id: leave.display_id },
});

    io.to(`user:${leave.user_id}`).emit('LEAVE_UPDATED', {
      id:     leave.id,
      status: 'approved',
    });

    await t.commit();

    try {
 const slp =  await sendLeaveApprovedEmail({

    
    employee: leave.employee,
    leave,
    approvedBy,
    leaveDays,


    
  });
 console.log("🚀 ~ approveLeave ~ slp:", slp)
} catch (err) {
  console.error("Leave approval email failed:", err);
}


    return res.status(200).json({
      message: 'Leave request approved.',
      leave_days: leaveDays,
 sandwich_days: totalSandwichDays,
    });

  } catch (err) {
     if (t.finished !== "commit") {
    await t.rollback();
  }
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

    const rejectedBy = await User.findByPk(admin_id, {
  attributes: ["id", "name"],
});
    const leave = await LeaveRequest.findByPk(id, {
  include: [
    {
      model: User,
      as: "employee",
      attributes: [
        "id",
        "name",
        "employee_id",
        "email",
        "saturday_group",
      ],
    },
  ],
});


    if (!leave) {
      await t.rollback();
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    const leaveDays = await countLeaveDays(
  leave.start_date,
  leave.end_date,
  leave.duration,
  leave.employee.saturday_group
);



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



try {
    const slr = await sendLeaveRejectedEmail({
    employee: leave.employee,
    leave,
    rejectedBy,
    rejectionReason: leave.rejection_reason,
    leaveDays,
});
  console.log("🚀 ~ rejectLeave ~ slr:", slr)

} catch (error) {
  console.log("🚀 ~ rejectLeave ~ error:", error)
}

    const io = req.app.get('io');

await createNotification(io, {
  user_id: leave.user_id,
  type:    'LEAVE_REJECTED',
  title:   'Leave Request Rejected',
  message: `Your leave request (${leave.display_id}) has been rejected.`,
  data:    { leave_id: leave.id, display_id: leave.display_id },
});

io.to(`user:${leave.user_id}`).emit('LEAVE_UPDATED', {
  id:     leave.id,
  status: 'rejected',
});

// ← ADD: admin confirmation copy
await notifyAdmins(io, {
  type:    'LEAVE_REJECTED',
  title:   'Leave Rejected',
  message: `You rejected ${(await User.findByPk(leave.user_id, { attributes: ['name'] }))?.name}'s leave request (${leave.display_id}).`,
  data:    { leave_id: leave.id, display_id: leave.display_id },
});

    return res.status(200).json({ message: 'Leave request rejected.' });

  } catch (err) {
    if (t.finished !== "commit") {
    await t.rollback();
}
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Mark Worked Saturday
// ─────────────────────────────────────────────

  
const markWorkedSaturday = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const admin_id = req.user.id;
    const { user_id, saturday_date } = req.body;

    if (!user_id || !saturday_date) {
      await t.rollback();
      return res.status(400).json({ message: 'user_id and saturday_date are required.' });
    }

// ✅ replace with this — parse date parts directly, no timezone conversion
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(saturday_date)) {
  await t.rollback();
  return res.status(400).json({ message: 'Invalid saturday_date format. Use YYYY-MM-DD.' });
}

const [year, month, day] = saturday_date.split('-').map(Number);
console.log("🚀 ~ markWorkedSaturday ~ [year, month, day]:", [year, month, day])
const date = new Date(year, month - 1, day); // local date, no UTC shift
console.log("🚀 ~ markWorkedSaturday ~ date:", date)
if (date.getDay() !== 6) {
  await t.rollback();
  return res.status(400).json({ message: 'Provided date is not a Saturday.' });
}
    // Prevent duplicate entry for same employee + same date
    const existing = await WorkedSaturday.findOne({
      where: { user_id, saturday_date },
    });
    console.log("🚀 ~ markWorkedSaturday ~ existing:", existing)

    if (existing) {
      await t.rollback();
      return res.status(409).json({ message: 'This Saturday is already marked as worked for this employee.' });
    }

    const record = await WorkedSaturday.create({
      user_id,
      saturday_date,
      is_exchanged: false,
      marked_by: admin_id,
    }, { transaction: t });
    console.log("🚀 ~ markWorkedSaturday ~ record:", record)

     await t.commit();
     
    return res.status(201).json({
      message: 'Saturday marked as worked.',
      record,
    });

  } catch (err) {
    console.log("🚀 ~ markWorkedSaturday ~ err:", err)
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN — Get Available Saturdays for Employee
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// GET AVAILABLE WORKED SATURDAYS FOR EMPLOYEE
// Location: leaveRequests.controller.js
// ─────────────────────────────────────────────
const getWorkedSaturdays = async (req, res) => {
  try {
    const user_id = req.params.user_id || req.user?.id;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Return ALL worked Saturdays for this user that haven't been exchanged yet
    const saturdays = await WorkedSaturday.findAll({
      where: {
        user_id,
        is_exchanged: false,
      },
      order: [["saturday_date", "ASC"]],
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
// GET Company Settings
// ─────────────────────────────────────────────

const getCompanySettings = async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Company settings not found.' });
    }
    return res.status(200).json({ settings });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE Company Settings
// ─────────────────────────────────────────────

const updateCompanySettings = async (req, res) => {
  try {
    const { office_start_time, full_day_notice_hours, half_day_notice_hours } = req.body;

    const errors = [];

    if (office_start_time !== undefined) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(office_start_time)) {
        errors.push('office_start_time must be in HH:MM format.');
      }
    }

    if (full_day_notice_hours !== undefined) {
      if (!Number.isInteger(Number(full_day_notice_hours)) || Number(full_day_notice_hours) < 1) {
        errors.push('full_day_notice_hours must be a positive integer.');
      }
    }

    if (half_day_notice_hours !== undefined) {
      if (!Number.isInteger(Number(half_day_notice_hours)) || Number(half_day_notice_hours) < 1) {
        errors.push('half_day_notice_hours must be a positive integer.');
      }
    }

    if (
      full_day_notice_hours !== undefined &&
      half_day_notice_hours !== undefined &&
      Number(half_day_notice_hours) >= Number(full_day_notice_hours)
    ) {
      errors.push('half_day_notice_hours must be less than full_day_notice_hours.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed.', errors });
    }

    const settings = await CompanySettings.findOne();

    if (!settings) {
      return res.status(404).json({ message: 'Company settings not found.' });
    }

    await settings.update({
      office_start_time:      office_start_time      ?? settings.office_start_time,
      full_day_notice_hours:  full_day_notice_hours  ?? settings.full_day_notice_hours,
      half_day_notice_hours:  half_day_notice_hours  ?? settings.half_day_notice_hours,
    });

    return res.status(200).json({
      message:  'Settings updated successfully.',
      settings,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


const getLeaveCalculation = async (req, res) => {
  try {
    const { user_id, month } = req.query;

    if (!req.query.years) {
      return res.status(400).json({
        message: "At least one year is required.",
      });
    }

    const selectedYears = req.query.years
      .split(",")
      .map(Number)
      .filter(Boolean);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const result = [];

    for (const year of selectedYears) {
      let maxMonth;

      if (month) {
        maxMonth = Number(month);
      } else if (year < currentYear) {
        maxMonth = 12;
      } else if (year === currentYear) {
        maxMonth = currentMonth;
      } else {
        maxMonth = 0;
      }

      const where = { year };

      if (month) {
        // Monthly report
        where.month = maxMonth;
      } else {
        // Yearly report
        where.month = {
          [Op.lte]: maxMonth,
        };
      }

      if (user_id) {
        where.user_id = user_id;
      }

      const balances = await LeaveBalance.findAll({
        where,
        include: [employeeInclude],
        order: [[{ model: User, as: "employee" }, "name", "ASC"]],
      });

      const employeeMap = {};

      for (const balance of balances) {
        const id = balance.user_id;

        if (!employeeMap[id]) {
          employeeMap[id] = {
            employee_id: balance.employee.employee_id,
            name: balance.employee.name,

            entitled_paid: 0,
            used_paid: 0,
            used_unpaid: 0,
            used_exchange: 0,
          };
        }

        employeeMap[id].entitled_paid += Number(balance.entitled_paid);
        employeeMap[id].used_paid += Number(balance.used_paid);
        employeeMap[id].used_unpaid += Number(balance.used_unpaid);
        employeeMap[id].used_exchange += Number(balance.used_exchange);
      }

      const employees = Object.values(employeeMap).map((emp) => {
        if (month) {
          return {
            ...emp,
            total_leave:
              emp.used_paid +
              emp.used_unpaid +
              emp.used_exchange,
          };
        }

        return {
          ...emp,
          remaining_paid: Math.max(
            emp.entitled_paid - emp.used_paid,
            0
          ),
        };
      });

      const totals = employees.reduce(
  (acc, emp) => {
    acc.employees++;
    acc.entitled_paid += emp.entitled_paid;
    acc.used_paid += emp.used_paid;
    acc.used_unpaid += emp.used_unpaid;
    acc.used_exchange += emp.used_exchange;

    if (month) {
      acc.total_leave += emp.total_leave;
    } else {
      acc.remaining_paid += emp.remaining_paid;
    }

    return acc;
  },
  {
    employees: 0,
    entitled_paid: 0,
    used_paid: 0,
    used_unpaid: 0,
    used_exchange: 0,
    remaining_paid: 0,
    total_leave: 0,
  }
);
      result.push({
        year,
        type: month ? "monthly" : "yearly",
        ...(month && { month: Number(month) }),
        totals,
        employees,
      });
    }

    return res.status(200).json({
      message: "leave calculation",
      result,
    });
  } catch (err) {
    console.log("getLeaveCalculation:", err);
    return res.status(500).json({
      message: err.message,
    });
  }
};


// PATCH /api/leaves/:id/upload-document
// Employee only — own emergency leave only — medical_document must still be null
const uploadLeaveDocument = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user_id = req.user.id;
    const { id }  = req.params;

    console.log(req.body)
    if (!req.file) {
      await t.rollback();
      return res.status(400).json({ message: "A document file is required." });
    }

    const leave = await LeaveRequest.findOne({
      where: { id, user_id },
      include: [
        { model: User, as: "employee", attributes: ["id", "name", "email", "employee_id"] },
      ],
    });

    if (!leave) {
      await t.rollback();
      return res.status(404).json({ message: "Leave request not found." });
    }

    if (leave.reason_type !== LEAVE_REASONS.EMERGENCY) {
      await t.rollback();
      return res.status(400).json({ message: "Document upload is only for emergency leaves." });
    }

    if (leave.medical_document) {
      await t.rollback();
      return res.status(400).json({ message: "A document has already been uploaded for this leave." });
    }

    // Move file from temp upload to permanent location
    const moved = moveUploadedFile(
      req.file.path,
      `leaves/${leave.id}`,
      "medical_document"
    );

    if (!moved) {
      await t.rollback();
      return res.status(500).json({ message: "Failed to save document." });
    }



    await leave.update(
      {
        medical_document:     moved.url,
        document_uploaded_at: new Date(),
      },
      { transaction: t }
    );

    await LeaveLog.create(
      {
        leave_request_id: leave.id,
        user_id,
        action:  "document_uploaded",
        remarks: { file_path: moved },
      },
      { transaction: t }
    );

    await t.commit();

    // Fire-and-forget email to admins with attachment
    const leaveDays = await countLeaveDays(
      leave.start_date,
      leave.end_date,
      leave.duration
    );

    // const absoluteDocPath = moved.path;

    sendDocumentUploadedEmail({
      employee: leave.employee,
      leave: {
        ...leave.toJSON(),
        medical_document_path:  moved.file_path,  // absolute path for nodemailer attachment
      },
      leaveDays,
    }).catch((err) => console.error("Document upload email failed:", err));

    return res.status(200).json({
      message: "Document uploaded successfully.",
      medical_document: moved.url,
       document_uploaded_at: leave.document_uploaded_at,
    });
  } catch (err) {
    if (t.finished !== "commit") {
    await t.rollback();
  }
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// PRIVATE HELPERS — Balance deduction/reversal
// ─────────────────────────────────────────────

const _applyBalanceDeduction = async ({ user_id, leave_type, days, month, year, t }) => {
  const [balance] = await LeaveBalance.findOrCreate({
    where: { user_id, month, year },
    defaults: { entitled_paid: 2, used_paid: 0, used_unpaid: 0, used_exchange: 0 },
    transaction: t,
  });

  if (leave_type === LEAVE_TYPES.EXCHANGE) {
    await balance.update(
      { used_exchange: parseFloat(balance.used_exchange) + days },
      { transaction: t }
    );
    return;
  }

  if (leave_type === LEAVE_TYPES.UNPAID) {
    await balance.update(
      { used_unpaid: parseFloat(balance.used_unpaid) + days },
      { transaction: t }
    );
    return;
  }

  // PAID — consume paid first, overflow to unpaid
  const remainingPaid = parseFloat(balance.entitled_paid) - parseFloat(balance.used_paid);
  let addToPaid = 0;
  let addToUnpaid = 0;
  if (remainingPaid <= 0) {
    addToUnpaid = days;
  } else if (remainingPaid >= days) {
    addToPaid = days;
  } else {
    addToPaid = remainingPaid;
    addToUnpaid = days - remainingPaid;
  }
  await balance.update(
    {
      used_paid:   parseFloat(balance.used_paid)   + addToPaid,
      used_unpaid: parseFloat(balance.used_unpaid) + addToUnpaid,
    },
    { transaction: t }
  );
};



const _reverseBalanceDeduction = async ({ user_id, leave_type, days, month, year, t }) => {
  const balance = await LeaveBalance.findOne({ where: { user_id, month, year }, transaction: t });
  if (!balance) return;

  if (leave_type === LEAVE_TYPES.EXCHANGE) {
    await balance.update(
      { used_exchange: Math.max(0, parseFloat(balance.used_exchange) - days) },
      { transaction: t }
    );
    return;
  }

  if (leave_type === LEAVE_TYPES.UNPAID) {
    await balance.update(
      { used_unpaid: Math.max(0, parseFloat(balance.used_unpaid) - days) },
      { transaction: t }
    );
    return;
  }

  // PAID — restore paid first, then unpaid overflow
  const toRestorePaid = Math.min(days, parseFloat(balance.used_paid));
  const toRestoreUnpaid = Math.max(0, days - toRestorePaid);
  await balance.update(
    {
      used_paid:   Math.max(0, parseFloat(balance.used_paid)   - toRestorePaid),
      used_unpaid: Math.max(0, parseFloat(balance.used_unpaid) - toRestoreUnpaid),
    },
    { transaction: t }
  );
};

// ─────────────────────────────────────────────
// GET /api/leaves/adjacent-check
// Employee — checks if selected dates create a sandwich with existing approved leaves
// ─────────────────────────────────────────────

const checkAdjacentLeaves = async (req, res) => {
  try {
    const { start_date, end_date, duration } = req.query;
    const user_id = req.user.id;

    if (!start_date || !end_date || !duration) {
      return res.status(400).json({ message: 'start_date, end_date, duration are required.' });
    }

    const ABSENT_UNTIL_EOD = ['full_day'];
    const ABSENT_FROM_SOD  = ['full_day'];

    const dayBefore = new Date(start_date);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(end_date);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const [leftLeave, rightLeave] = await Promise.all([
      LeaveRequest.findOne({
        where: {
          user_id,
          status: LEAVE_STATUS.APPROVED,
          leave_type: { [Op.ne]: 'exchange' },
          end_date: { [Op.lte]: dayBefore.toISOString().split('T')[0] },
        },
        order: [['end_date', 'DESC']],
        attributes: ['id', 'display_id', 'end_date', 'duration'],
      }),
      LeaveRequest.findOne({
        where: {
          user_id,
          status: LEAVE_STATUS.APPROVED,
          leave_type: { [Op.ne]: 'exchange' },
          start_date: { [Op.gte]: dayAfter.toISOString().split('T')[0] },
        },
        order: [['start_date', 'ASC']],
        attributes: ['id', 'display_id', 'start_date', 'duration'],
      }),
    ]);

    const employee = await User.findByPk(user_id, { attributes: ['saturday_group'] });
    const warnings = [];

    if (
      leftLeave &&
      ABSENT_UNTIL_EOD.includes(leftLeave.duration) &&
      ABSENT_FROM_SOD.includes(duration)
    ) {
      const gapStart = new Date(leftLeave.end_date);
      gapStart.setDate(gapStart.getDate() + 1);
      const gapEnd = new Date(start_date);
      gapEnd.setDate(gapEnd.getDate() - 1);

      if (gapStart <= gapEnd) {
        const gapStartStr = gapStart.toISOString().split('T')[0];
        const gapEndStr   = gapEnd.toISOString().split('T')[0];
        const offDays     = await getOffDaysInRange(gapStartStr, gapEndStr, employee.saturday_group);
        const totalGap    = Math.round((gapEnd - gapStart) / (1000 * 60 * 60 * 24)) + 1;

        // Sandwich only if every day in the gap is an off-day
        if (offDays.size === totalGap) {
          warnings.push({
            side: 'left',
            adjacent_leave_id: leftLeave.display_id,
            sandwich_days: offDays.size,
            message: `${offDays.size} off-day(s) between your existing leave (${leftLeave.display_id}) and this request will be counted as leave days (sandwich rule).`,
          });
        }
      }
    }

    if (
      rightLeave &&
      ABSENT_UNTIL_EOD.includes(duration) &&
      ABSENT_FROM_SOD.includes(rightLeave.duration)
    ) {
      const gapStart = new Date(end_date);
      gapStart.setDate(gapStart.getDate() + 1);
      const gapEnd = new Date(rightLeave.start_date);
      gapEnd.setDate(gapEnd.getDate() - 1);

      if (gapStart <= gapEnd) {
        const gapStartStr = gapStart.toISOString().split('T')[0];
        const gapEndStr   = gapEnd.toISOString().split('T')[0];
        const offDays     = await getOffDaysInRange(gapStartStr, gapEndStr, employee.saturday_group);
        const totalGap    = Math.round((gapEnd - gapStart) / (1000 * 60 * 60 * 24)) + 1;

        // Sandwich only if every day in the gap is an off-day
        if (offDays.size === totalGap) {
          warnings.push({
            side: 'right',
            adjacent_leave_id: rightLeave.display_id,
            sandwich_days: offDays.size,
            message: `${offDays.size} off-day(s) between this request and your existing leave (${rightLeave.display_id}) will be counted as leave days (sandwich rule).`,
          });
        }
      }
    }

    return res.status(200).json({ has_warning: warnings.length > 0, warnings });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
// ─────────────────────────────────────────────
// PATCH /api/leaves/:id/reverse  (admin only)
// Reverses an approved leave and restores balance precisely
// ─────────────────────────────────────────────

const reverseLeave = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const admin_id = req.user.id;
    const { id }   = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Reversal reason is required.' });
    }

    const leave = await LeaveRequest.findByPk(id, {
      include: [{ model: User, as: 'employee', attributes: ['id', 'name', 'saturday_group'] }],
    });

    if (!leave) {
      await t.rollback();
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    if (leave.status !== LEAVE_STATUS.APPROVED) {
      await t.rollback();
      return res.status(400).json({ message: 'Only approved leaves can be reversed.' });
    }

    // Read the approval log for exact bucket breakdown
    const approvalLog = await LeaveLog.findOne({
      where: { leave_request_id: id, action: 'approved' },
      order: [['created_at', 'DESC']],
    });

    const monthBuckets = approvalLog?.remarks?.month_buckets
      || splitDaysByMonth(leave.start_date, leave.end_date, leave.duration);

    for (const bucket of monthBuckets) {
      await _reverseBalanceDeduction({
        user_id:    leave.user_id,
        leave_type: leave.leave_type,
        days:       bucket.days,
        month:      bucket.month,
        year:       bucket.year,
        t,
      });
    }

    const sandwichBuckets = approvalLog?.remarks?.sandwich_buckets || [];
    for (const bucket of sandwichBuckets) {
      if (bucket.days <= 0) continue;
      await _reverseBalanceDeduction({
        user_id:    leave.user_id,
        leave_type: LEAVE_TYPES.UNPAID,
        days:       bucket.days,
        month:      bucket.month,
        year:       bucket.year,
        t,
      });
    }

    if (leave.leave_type === LEAVE_TYPES.EXCHANGE && leave.worked_saturday_id) {
      await WorkedSaturday.update(
        { is_exchanged: false },
        { where: { id: leave.worked_saturday_id }, transaction: t }
      );
    }

    await leave.update({ status: LEAVE_STATUS.CANCELLED }, { transaction: t });

    await LeaveLog.create(
      {
        leave_request_id: leave.id,
        user_id:          admin_id,
        action:           'reversed',
        remarks: {
          reason:          reason.trim(),
          undone_buckets:  monthBuckets,
          undone_sandwich: sandwichBuckets,
        },
      },
      { transaction: t }
    );

    await t.commit();

    const io = req.app.get('io');
    await createNotification(io, {
      user_id: leave.user_id,
      type:    'LEAVE_REJECTED',
      title:   'Leave Approval Reversed',
      message: `Your approved leave (${leave.display_id}) has been reversed by admin.`,
      data:    { leave_id: leave.id, display_id: leave.display_id },
    });
    io.to(`user:${leave.user_id}`).emit('LEAVE_UPDATED', { id: leave.id, status: 'cancelled' });


    // ── Email — fire and forget ──
    const leaveDays = await countLeaveDays(
  leave.start_date,
  leave.end_date,
  leave.duration
);
    console.log("🚀 ~ reverseLeave ~ leaveDays:", leaveDays)

// To employee — balance restored confirmation
sendApprovedLeaveCancelledEmail({
  employee: leave.employee,
  leave,
  leaveDays,
}).catch(err => console.error('Reverse leave email (employee) failed:', err));

// To admins — audit trail
sendLeaveCancelledEmail({
  employee: leave.employee,
  leave,
  leaveDays,
}).catch(err => console.error('Reverse leave email (admin) failed:', err));



    return res.status(200).json({ message: 'Leave reversed and balance restored.' });
  } catch (err) {
    if (t.finished !== 'commit') await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};


module.exports.leaveController = {
  createLeave,
  getMyLeaves,
  cancelLeave,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  markWorkedSaturday,
  getWorkedSaturdays,
  getLeaveLogs,
    getCompanySettings,
  updateCompanySettings,
   getLeaveCalculation,
   uploadLeaveDocument,
     checkAdjacentLeaves,  
  reverseLeave,       
  

}