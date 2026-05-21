const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { getDashboard, getTeamDashboard, getEmployeeDashboard} = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/dashboard", authenticate, requireAdmin, getDashboard);

// teams.routes.js
router.get("/dashboard/:id/dashboard", authenticate, getTeamDashboard);

// Add new dashboard route file or in existing:
// dashboard.routes.js (employee)
router.get("/dashboard/me/dashboard", authenticate, getEmployeeDashboard);
module.exports = router;