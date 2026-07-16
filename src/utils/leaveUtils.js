const { PublicHoliday, WorkedSaturday } = require("../models");

/**
 * Get all off-day dates in a range (Sundays, off Saturdays, public holidays)
 * Used to calculate sandwich leave days
 */
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