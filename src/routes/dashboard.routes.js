const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { getDashboard } = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/dashboard", authenticate, requireAdmin, getDashboard);

module.exports = router;