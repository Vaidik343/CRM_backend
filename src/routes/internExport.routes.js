const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { exportInternReport } = require("../controllers/internExportController");

const router = express.Router();

// 1. Admin route to export any intern's report by ID
router.get("/admin/interns/:id/export", authenticate, requireAdmin, exportInternReport);

// 2. Intern self-export route (Logged-in intern exporting their own data)
router.get("/intern/export", authenticate, exportInternReport);

module.exports = router;
