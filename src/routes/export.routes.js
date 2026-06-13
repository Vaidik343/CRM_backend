const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { exportData, exportMyData , exportEmployeeData } = require("../controllers/export.controller");

const router = express.Router();

router.get("/export", authenticate, requireAdmin, exportData);
router.get("/export/mine", authenticate, exportMyData); 
router.get("/export/employee/:userId", authenticate, requireAdmin, exportEmployeeData);
module.exports = router;