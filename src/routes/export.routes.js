const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/role.middleware");
const { exportData, exportMyData , exportEmployeeData, exportProjectData ,exportAllEmployeeData, exportLeaveData } = require("../controllers/export.controller");

const router = express.Router();

router.get("/export", authenticate, requireAdmin, exportData);
router.get("/export/mine", authenticate, exportMyData); 
router.get("/export/employee/:userId", authenticate, requireAdmin, exportEmployeeData);
router.get("/export/:userId/export/all", authenticate, requireAdmin, exportAllEmployeeData);
router.get("/export/project/:projectId", authenticate, exportProjectData);

// Admin only
router.get("/export/leaves", authenticate, requireAdmin, exportLeaveData);
module.exports = router;