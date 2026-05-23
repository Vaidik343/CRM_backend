const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { getDashboard, getTeamDashboard, getEmployeeDashboard} = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/dashboard", authenticate, requireAdmin, getDashboard);
router.get("/teams/:id/dashboard", authenticate, getTeamDashboard);           // team
router.get("/me/dashboard", authenticate, getEmployeeDashboard);  
module.exports = router;