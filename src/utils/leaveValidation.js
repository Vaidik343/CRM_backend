const { Op } = require("sequelize");
const {
  LeaveRequest,
  CompanySettings,
  PublicHoliday,
  WorkedSaturday,
} = require("../models");

const {
  LEAVE_TYPES,
  LEAVE_REASONS,
  LEAVE_DURATION,
  LEAVE_STATUS,
} = require("../constants/leaveConstants");

const validateLeaveDates = ({ start_date, end_date, exchange_date }) => {
  const start = new Date(start_date);
  const end = new Date(end_date);
  if (isNaN(start) || isNaN(end)) throw new Error("Invalid leave dates.");
  if (start > end) throw new Error("Start date cannot be after end date.");
  if (exchange_date) {
    const exchange = new Date(exchange_date);
    if (isNaN(exchange)) throw new Error("Invalid exchange date.");
    if (exchange.toDateString() === start.toDateString())
      throw new Error("Exchange date cannot be the same as leave date.");
  }
};

const validateDuplicateLeave = async ({
  user_id,
  start_date,
  end_date,
  duration,
  exclude_id = null,
}) => {
  const activeStatuses = [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED];

  const fullDayConflict = await LeaveRequest.findOne({
    where: {
      user_id,
      status: { [Op.in]: activeStatuses },
      ...(exclude_id && { id: { [Op.ne]: exclude_id } }),
      [Op.and]: [
        { start_date: { [Op.lte]: new Date(end_date) } },
        { end_date: { [Op.gte]: new Date(start_date) } },
      ],
      [Op.or]: [
        { duration: LEAVE_DURATION.FULL_DAY },
        ...(duration === LEAVE_DURATION.FULL_DAY
          ? [{ duration: { [Op.ne]: null } }]
          : []),
      ],
    },
  });

  if (fullDayConflict) {
    throw new Error(
      `You already have a leave request (${fullDayConflict.display_id}) that conflicts with the selected dates.`
    );
  }

  if (
    duration === LEAVE_DURATION.FIRST_HALF ||
    duration === LEAVE_DURATION.SECOND_HALF
  ) {
    const complementaryHalf =
      duration === LEAVE_DURATION.FIRST_HALF
        ? LEAVE_DURATION.SECOND_HALF
        : LEAVE_DURATION.FIRST_HALF;

    const halfDayConflict = await LeaveRequest.findOne({
      where: {
        user_id,
        status: { [Op.in]: activeStatuses },
        ...(exclude_id && { id: { [Op.ne]: exclude_id } }),
        start_date: new Date(start_date),
        duration: {
          [Op.notIn]: [LEAVE_DURATION.FULL_DAY, complementaryHalf],
        },
      },
    });

    if (halfDayConflict) {
      throw new Error(
        `You already have a ${halfDayConflict.duration} leave request (${halfDayConflict.display_id}) on this day.`
      );
    }
  }
};

const validateNoticePeriod = async ({ reason_type, duration, start_date }) => {
  if (reason_type === LEAVE_REASONS.EMERGENCY) return;
  const settings = await CompanySettings.findOne();
  if (!settings) throw new Error("Company settings not configured.");
  const officeTime = settings.office_start_time;
  const officeHour = Number(officeTime.split(":")[0]);
  const officeMinute = Number(officeTime.split(":")[1]);
  const [year, month, day] = start_date.split("T")[0].split("-").map(Number);
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const leaveStartUTC =
    Date.UTC(year, month - 1, day, officeHour, officeMinute, 0, 0) - IST_OFFSET_MS;
  const noticeHours =
    duration === LEAVE_DURATION.FULL_DAY
      ? settings.full_day_notice_hours
      : settings.half_day_notice_hours;
  const deadlineUTC = leaveStartUTC - noticeHours * 60 * 60 * 1000;
  if (Date.now() > deadlineUTC) {
    throw new Error(
      `Leave request must be submitted at least ${noticeHours} hours before office start time.`
    );
  }
};

const validateExchangeLeave = async ({ leave_type, worked_saturday_id, user_id }) => {
  if (leave_type !== LEAVE_TYPES.EXCHANGE) return;
  if (!worked_saturday_id)
    throw new Error("You must select a worked Saturday to exchange.");
  const workedSaturday = await WorkedSaturday.findOne({
    where: { id: worked_saturday_id, user_id, is_exchanged: false },
  });
  if (!workedSaturday)
    throw new Error("Selected Saturday is not available for exchange.");
};

const getOffDaysInRange = async (start_date, end_date, saturday_group) => {
  const offDays = new Set();
  const holidays = await PublicHoliday.findAll({
    where: { date: { [Op.between]: [start_date, end_date] } },
    attributes: ["date"],
  });
  holidays.forEach((h) => offDays.add(h.date));

  const current = new Date(start_date);
  const end = new Date(end_date);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split("T")[0];
    const weekOfMonth = Math.ceil(current.getDate() / 7);
    if (dayOfWeek === 0) offDays.add(dateStr); // Sunday always off
    if (dayOfWeek === 6) {
      if (saturday_group === "A") {
        if (weekOfMonth !== 1 && weekOfMonth !== 3) offDays.add(dateStr);
      } else if (saturday_group === "B") {
        if (weekOfMonth !== 2 && weekOfMonth !== 4) offDays.add(dateStr);
      }
      // null group — Saturdays are NOT counted as off-days (exchange system handles it)
    }
    current.setDate(current.getDate() + 1);
  }
  return offDays;
};

const countLeaveDays = async (start_date, end_date, duration) => {
  if (
    duration === LEAVE_DURATION.FIRST_HALF ||
    duration === LEAVE_DURATION.SECOND_HALF
  )
    return 0.5;
  const start = new Date(start_date);
  const end = new Date(end_date);
  const diffMs = end - start;
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
};

const splitDaysByMonth = (start_date, end_date, duration) => {
  if (
    duration === LEAVE_DURATION.FIRST_HALF ||
    duration === LEAVE_DURATION.SECOND_HALF
  ) {
    const d = new Date(start_date);
    return [{ month: d.getMonth() + 1, year: d.getFullYear(), days: 0.5 }];
  }
  const result = {};
  const current = new Date(start_date);
  const end = new Date(end_date);
  while (current <= end) {
    const month = current.getMonth() + 1;
    const year = current.getFullYear();
    const key = `${year}-${month}`;
    if (!result[key]) result[key] = { month, year, days: 0 };
    result[key].days += 1;
    current.setDate(current.getDate() + 1);
  }
  return Object.values(result);
};

const ABSENT_UNTIL_EOD = [LEAVE_DURATION.FULL_DAY, LEAVE_DURATION.SECOND_HALF];
const ABSENT_FROM_SOD = [LEAVE_DURATION.FULL_DAY, LEAVE_DURATION.FIRST_HALF];

// ── Helper: count total calendar days in a range ──
const totalDaysInRange = (startStr, endStr) => {
  const s = new Date(startStr);
  const e = new Date(endStr);
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
};

const computeSandwichDays = async ({ user_id, newLeave, saturday_group }) => {
  const sandwichBuckets = {};

  const addDayToBucket = (dateStr) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const key = `${year}-${month}`;
    if (!sandwichBuckets[key]) sandwichBuckets[key] = { month, year, days: 0 };
    sandwichBuckets[key].days += 1;
  };

  const approvedLeaves = await LeaveRequest.findAll({
    where: {
      user_id,
      status: LEAVE_STATUS.APPROVED,
      id: { [Op.ne]: newLeave.id },
      leave_type: { [Op.ne]: 'exchange' },
    },
    order: [["start_date", "ASC"]],
    attributes: ["id", "start_date", "end_date", "duration"],
  });

  const allLeaves = [
    ...approvedLeaves.map((l) => ({
      id: l.id,
      start_date: new Date(l.start_date),
      end_date: new Date(l.end_date),
      duration: l.duration,
    })),
    {
      id: newLeave.id,
      start_date: new Date(newLeave.start_date),
      end_date: new Date(newLeave.end_date),
      duration: newLeave.duration,
    },
  ].sort((a, b) => a.start_date - b.start_date);

  for (let i = 0; i < allLeaves.length - 1; i++) {
    const left = allLeaves[i];
    const right = allLeaves[i + 1];

    const involvesNewLeave = left.id === newLeave.id || right.id === newLeave.id;
    if (!involvesNewLeave) continue;

    const gapStart = new Date(left.end_date);
    gapStart.setDate(gapStart.getDate() + 1);
    const gapEnd = new Date(right.start_date);
    gapEnd.setDate(gapEnd.getDate() - 1);
    if (gapStart > gapEnd) continue;

    const leftClosesGap = ABSENT_UNTIL_EOD.includes(left.duration);
    const rightClosesGap = ABSENT_FROM_SOD.includes(right.duration);
    if (!leftClosesGap || !rightClosesGap) continue;

    const gapStartStr = gapStart.toISOString().split("T")[0];
    const gapEndStr = gapEnd.toISOString().split("T")[0];

    const offDays = await getOffDaysInRange(gapStartStr, gapEndStr, saturday_group);
    const totalGap = totalDaysInRange(gapStartStr, gapEndStr);

    // ── Sandwich only applies if EVERY day in the gap is an off-day ──
    if (offDays.size < totalGap) continue;

    offDays.forEach((dateStr) => addDayToBucket(dateStr));
  }

  return Object.values(sandwichBuckets);
};

const getApprovedLeaveDatesInRange = async (user_id, start_date, end_date) => {
  const coveredDates = new Set();

  const leavesInGap = await LeaveRequest.findAll({
    where: {
      user_id,
      status: LEAVE_STATUS.APPROVED,
      [Op.and]: [
        { start_date: { [Op.lte]: end_date } },
        { end_date:   { [Op.gte]: start_date } },
      ],
    },
    attributes: ['start_date', 'end_date', 'duration'],
  });

  for (const leave of leavesInGap) {
    const current = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    while (current <= end) {
      coveredDates.add(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  }

  return coveredDates;
};

module.exports = {
  validateLeaveDates,
  validateDuplicateLeave,
  validateNoticePeriod,
  validateExchangeLeave,
  getOffDaysInRange,
  countLeaveDays,
  splitDaysByMonth,
  computeSandwichDays,
  getApprovedLeaveDatesInRange,
};