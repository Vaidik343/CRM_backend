'use strict';

// ─────────────────────────────────────────────
// VALIDATE CREATE LEAVE
// ─────────────────────────────────────────────

const validateCreateLeave = (req, res, next) => {
  const {
    leave_type,
    reason_type,
    start_date,
    end_date,
    duration,
    reason,
    worked_saturday_id,
  } = req.body;

  const errors = [];

  // ── Required fields ──
  if (!leave_type)              errors.push('leave_type is required.');
  if (!reason_type)             errors.push('reason_type is required.');
  if (!start_date)              errors.push('start_date is required.');
  if (!end_date)                errors.push('end_date is required.');
  if (!duration)                errors.push('duration is required.');
  if (!reason || !reason.trim()) errors.push('reason is required.');

  // ── Enum checks ──
  const validLeaveTypes  = ['paid', 'unpaid', 'exchange'];
  const validReasonTypes = ['normal', 'emergency'];
  const validDurations   = ['full_day', 'first_half', 'second_half'];

  if (leave_type && !validLeaveTypes.includes(leave_type)) {
    errors.push(`leave_type must be one of: ${validLeaveTypes.join(', ')}.`);
  }

  if (reason_type && !validReasonTypes.includes(reason_type)) {
    errors.push(`reason_type must be one of: ${validReasonTypes.join(', ')}.`);
  }

  if (duration && !validDurations.includes(duration)) {
    errors.push(`duration must be one of: ${validDurations.join(', ')}.`);
  }

  // ── Date format checks ──
  if (start_date && isNaN(new Date(start_date))) {
    errors.push('start_date is not a valid date.');
  }

  if (end_date && isNaN(new Date(end_date))) {
    errors.push('end_date is not a valid date.');
  }

  // ── Exchange: worked_saturday_id required ──
  if (leave_type === 'exchange' && !worked_saturday_id) {
    errors.push('worked_saturday_id is required for exchange leave.');
  }

  // ── Non-exchange: worked_saturday_id must not be sent ──
  if (leave_type && leave_type !== 'exchange' && worked_saturday_id) {
    errors.push('worked_saturday_id should not be provided for non-exchange leave.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  next();
};

// ─────────────────────────────────────────────
// VALIDATE REJECT LEAVE
// ─────────────────────────────────────────────

const validateRejectLeave = (req, res, next) => {
  const { rejection_reason } = req.body;

  if (!rejection_reason || !rejection_reason.trim()) {
    return res.status(400).json({ message: 'rejection_reason is required.' });
  }

  if (rejection_reason.trim().length < 5) {
    return res.status(400).json({ message: 'rejection_reason must be at least 5 characters.' });
  }

  if (rejection_reason.trim().length > 700) {
    return res.status(400).json({ message: 'rejection_reason cannot exceed 700 characters.' });
  }

  next();
};

// ─────────────────────────────────────────────
// VALIDATE MARK SATURDAY
// ─────────────────────────────────────────────

const validateMarkSaturday = (req, res, next) => {
  const { user_id, saturday_date } = req.body;

  const errors = [];

  if (!user_id)       errors.push('user_id is required.');
  if (!saturday_date) errors.push('saturday_date is required.');

  if (saturday_date && isNaN(new Date(saturday_date))) {
    errors.push('saturday_date is not a valid date.');
  }

  if (saturday_date && !isNaN(new Date(saturday_date))) {
    if (new Date(saturday_date).getDay() !== 6) {
      errors.push('saturday_date must be a Saturday.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  next();
};

// ─────────────────────────────────────────────
// VALIDATE GET SATURDAYS PARAM
// ─────────────────────────────────────────────

const validateGetSaturdays = (req, res, next) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: 'user_id param is required.' });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(user_id)) {
    return res.status(400).json({ message: 'user_id must be a valid UUID.' });
  }

  next();
};

// ─────────────────────────────────────────────

module.exports = {
  validateCreateLeave,
  validateRejectLeave,
  validateMarkSaturday,
  validateGetSaturdays,
};