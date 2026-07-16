const { Op } = require("sequelize");
const {
  LeaveRequest,
  CompanySettings,
  PublicHoliday, WorkedSaturday
} = require("../models");

const {
  LEAVE_TYPES,
  LEAVE_REASONS,
  LEAVE_DURATION,
  LEAVE_STATUS,
} = require("../constants/leaveConstants");

/**
 * Validate leave dates
 */
const validateLeaveDates = ({
  start_date,
  end_date,
  exchange_date,
}) => {
  const start = new Date(start_date);
  const end = new Date(end_date);

  if (isNaN(start) || isNaN(end)) {
    throw new Error("Invalid leave dates.");
  }

  if (start > end) {
    throw new Error("Start date cannot be after end date.");
  }

  if (exchange_date) {
    const exchange = new Date(exchange_date);

    if (isNaN(exchange)) {
      throw new Error("Invalid exchange date.");
    }

    if (exchange.toDateString() === start.toDateString()) {
      throw new Error("Exchange date cannot be the same as leave date.");
    }
  }
};

/**
 * Prevent overlapping leave requests.
 * Pending and Approved leaves block new requests.
 */
const validateDuplicateLeave = async ({
  user_id,
  start_date,
  end_date,
}) => {
  const existing = await LeaveRequest.findOne({
    where: {
      user_id,
      status: {
        [Op.in]: [
          LEAVE_STATUS.PENDING,
          LEAVE_STATUS.APPROVED,
        ],
      },

      [Op.and]: [
        {
          start_date: {
            [Op.lte]: end_date,
          },
        },
        {
          end_date: {
            [Op.gte]: start_date,
          },
        },
      ],
    },
  });

  if (existing) {
    throw new Error(
      `You already have a leave request (${existing.display_id}) for the selected dates.`
    );
  }
};

/**
 * Validate notice period.
 *
 * Full Day  -> 36 Hours
 * Half Day  -> 16 Hours
 * Emergency -> Skip validation
 */
const validateNoticePeriod = async ({
  reason_type,
  duration,
  start_date,
}) => {
  if (reason_type === LEAVE_REASONS.EMERGENCY) {
    return;
  }

  const settings = await CompanySettings.findOne();

  if (!settings) {
    throw new Error("Company settings not configured.");
  }

  const officeTime = settings.office_start_time; // "09:00:00"

  const officeHour = Number(officeTime.split(":")[0]);
  const officeMinute = Number(officeTime.split(":")[1]);

  const leaveStart = new Date(start_date);

  leaveStart.setHours(
    officeHour,
    officeMinute,
    0,
    0
  );

  const noticeHours =
    duration === LEAVE_DURATION.FULL_DAY
      ? settings.full_day_notice_hours
      : settings.half_day_notice_hours;

  const deadline = new Date(
    leaveStart.getTime() -
      noticeHours * 60 * 60 * 1000
  );

  const now = new Date();

  if (now > deadline) {
    throw new Error(
      `Leave request must be submitted at least ${noticeHours} hours before office start time.`
    );
  }
};

/**
 * Exchange leave validation
 */
const validateExchangeLeave = async ({ leave_type, worked_saturday_id, user_id }) => {
  if (leave_type !== LEAVE_TYPES.EXCHANGE) return;

  if (!worked_saturday_id) {
    throw new Error("You must select a worked Saturday to exchange.");
  }

  const workedSaturday = await WorkedSaturday.findOne({
    where: {
      id: worked_saturday_id,
      user_id,
      is_exchanged: false,   // not already used
    },
  });

  if (!workedSaturday) {
    throw new Error("Selected Saturday is not available for exchange.");
  }
};



const getOffDaysInRange = async (start_date, end_date, saturday_group) => {
  const offDays = new Set();

  const start = new Date(start_date);
  const end   = new Date(end_date);

  // fetch public holidays in range
  const holidays = await PublicHoliday.findAll({
    where: {
      date: {
        [Op.between]: [start_date, end_date],
      },
    },
    attributes: ['date'],
  });

  holidays.forEach((h) => offDays.add(h.date));

  // loop every day in range
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat
    const dateStr   = current.toISOString().split('T')[0];
    const weekOfMonth = Math.ceil(current.getDate() / 7); // 1–5

    // Sunday — always off
    if (dayOfWeek === 0) {
      offDays.add(dateStr);
    }

    // Saturday — check if it's off based on group
    if (dayOfWeek === 6) {
      if (saturday_group === 'A') {
        // Group A works 1st and 3rd — off on 2nd, 4th, 5th
        if (weekOfMonth !== 1 && weekOfMonth !== 3) {
          offDays.add(dateStr);
        }
      } else if (saturday_group === 'B') {
        // Group B works 2nd and 4th — off on 1st, 3rd, 5th
        if (weekOfMonth !== 2 && weekOfMonth !== 4) {
          offDays.add(dateStr);
        }
      } else {
        // null group — treat all Saturdays as off
        offDays.add(dateStr);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return offDays;
};

/**
 * Count leave days with sandwich rule applied.
 *
 * Sandwich rule:
 *   Any off day (Sunday, off Saturday, public holiday)
 *   that falls BETWEEN two leave days is counted as a leave day.
 *   Since start_date and end_date are the actual leave days,
 *   everything in between is automatically counted — including off days.
 *
 * Half day = 0.5 days always.
 */
const countLeaveDays = async (start_date, end_date, duration, saturday_group) => {
  if (duration === 'first_half' || duration === 'second_half') {
    return 0.5;
  }

  const start = new Date(start_date);
  const end   = new Date(end_date);

  // total calendar days from start to end inclusive
  const diffMs = end - start;
  const days   = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return days;
};

module.exports = {
  validateLeaveDates,
  validateDuplicateLeave,
  validateNoticePeriod,
  validateExchangeLeave,
   countLeaveDays,
};