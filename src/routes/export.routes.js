const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { exportData } = require("../controllers/export.controller");

const router = express.Router();

router.get("/export", authenticate, requireAdmin, exportData);

module.exports = router;