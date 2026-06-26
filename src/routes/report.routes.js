const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { reportController } = require("../controllers/report.controller");

const router = express.Router();


router.get   ("/report/:id/calls",        authenticate, requireAdmin, reportController.getEmployeeCalls);

router.get   ("/report/:id/tasks",        authenticate, requireAdmin, reportController.getEmployeeTasks);

router.get   ("/report/:id/workLogs",        authenticate, requireAdmin, reportController.getEmployeeWorkLogs);


module.exports = router;