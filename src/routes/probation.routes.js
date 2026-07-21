
const express = require('express');
const router  = express.Router();

const {
  startProbation,
  passProbation,
  terminateProbation,
  getProbationEmployees,
  getProbationEmployee,
  updateProbationDates,
} = require('../controllers/probation.controller');

const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin }  = require('../middlewares/role.middleware');

// ─────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────

const validateStartProbation = (req, res, next) => {
  const { probation_start, probation_end } = req.body;
  const errors = [];

  if (!probation_start) errors.push('probation_start is required.');
  if (!probation_end)   errors.push('probation_end is required.');

  if (probation_start && isNaN(new Date(probation_start))) {
    errors.push('probation_start is not a valid date.');
  }

  if (probation_end && isNaN(new Date(probation_end))) {
    errors.push('probation_end is not a valid date.');
  }

  if (
    probation_start && probation_end &&
    !isNaN(new Date(probation_start)) && !isNaN(new Date(probation_end)) &&
    new Date(probation_start) >= new Date(probation_end)
  ) {
    errors.push('probation_end must be after probation_start.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  next();
};

const validateTerminate = (req, res, next) => {
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: 'Termination reason is required.' });
  }

  if (reason.trim().length < 5) {
    return res.status(400).json({ message: 'Reason must be at least 5 characters.' });
  }

  next();
};

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

// GET  /api/probation
// Query (all optional): page, limit, search
// probation_status: 'active' (default) | 'passed' | 'terminated' | 'all'
router.get(
  '/probation',
  authenticate,
  requireAdmin,
  getProbationEmployees
);

// GET /api/probation/:id
router.get(
  '/probation/:id',
  authenticate,
  requireAdmin,
  getProbationEmployee
);

// POST /api/probation/:id/start
// Required body: probation_start, probation_end
router.post(
  '/probation/:id/start',
  authenticate,
  requireAdmin,
  validateStartProbation,
  startProbation
);

// PATCH /api/probation/:id/pass
// No body required
router.patch(
  '/probation/:id/pass',
  authenticate,
  requireAdmin,
  passProbation
);

// PATCH /api/probation/:id/terminate
// Required body: reason
router.patch(
  '/probation/:id/terminate',
  authenticate,
  requireAdmin,
  validateTerminate,
  terminateProbation
);

// PATCH /api/probation/:id/dates
// Required body: at least one of probation_start or probation_end
router.patch(
  '/probation/:id/dates',
  authenticate,
  requireAdmin,
  updateProbationDates   
);

module.exports = router;