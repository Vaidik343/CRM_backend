
const express = require('express');
const router = express.Router();

const {
 leaveBalanceController
} = require('../controllers/leaveBalance.controller');

const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const {
  validateCreateLeave,
  validateRejectLeave,
  validateMarkSaturday,
  validateGetSaturdays,
} = require('../validations/leave.validations');


// Balance — employee
router.get('/leaves/balance/my', authenticate, leaveBalanceController.getMyBalance);

// Balance — admin
router.get('/leaves/balance/:user_id',         authenticate, requireAdmin, leaveBalanceController.getEmployeeBalance);
router.get('/leaves/balance/:user_id/history', authenticate, requireAdmin, leaveBalanceController.getEmployeeBalanceHistory);

// Public holidays — admin manages, all can read
router.get('/leaves/holidays',     authenticate, leaveBalanceController.getPublicHolidays);
router.post('/leaves/holidays',    authenticate, requireAdmin, leaveBalanceController.addPublicHoliday);
router.delete('/leaves/holidays/:id', authenticate, requireAdmin, leaveBalanceController.deletePublicHoliday);


module.exports = router;