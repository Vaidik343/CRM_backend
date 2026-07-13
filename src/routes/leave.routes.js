
const express = require('express');
const router = express.Router();

const {
 leaveController
} = require('../controllers/leaveRequests.controller');

const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const {
  validateCreateLeave,
  validateRejectLeave,
  validateMarkSaturday,
  validateGetSaturdays,
} = require('../validations/leave.validations');

// ─────────────────────────────────────────────
// EMPLOYEE ROUTES
// ─────────────────────────────────────────────

// emp create leaves
router.post('/leaves/request', authenticate, validateCreateLeave, leaveController.createLeave);

// my leaves
router.get('/leaves/my', authenticate, leaveController.getMyLeaves );
 
// PATCH /api/leave/cancel/:id

router.patch('/leaves/cancel/:id', authenticate, leaveController.cancelLeave);

// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────


router.get('/leaves/all', authenticate, requireAdmin, leaveController.getAllLeaves);

// approve
router.patch('/leaves/approve/:id', authenticate, requireAdmin, leaveController.approveLeave);

// PATCH /api/leave/reject/:id
// Params: id (leave request UUID)
// Required body: rejection_reason (5–700 chars)
router.patch('/leaves/reject/:id', authenticate, requireAdmin, validateRejectLeave, leaveController.rejectLeave);

// POST /api/leave/saturday/mark
// Required body: user_id, saturday_date (must be a Saturday)
router.post('/leaves/saturday/mark', authenticate, requireAdmin, validateMarkSaturday, leaveController.markWorkedSaturday);

// GET /api/leave/saturday/:user_id
// Params: user_id (UUID)
// Both admin and employee can access — employee needs it when submitting exchange leave
router.get('/leaves/saturday/:user_id', authenticate, validateGetSaturdays, leaveController.getWorkedSaturdays);

router.get('/leaves/:id/logs', authenticate, leaveController.getLeaveLogs);
// ─────────────────────────────────────────────

module.exports = router;