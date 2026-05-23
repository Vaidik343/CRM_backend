const express = require("express");
const { authenticate } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");
const { createWorkLog, listWorkLogs, getWorkLog, updateWorkLog, deleteWorkLog, createWorkLogValidators, updateWorkLogValidators } = require("../controllers/workLogs.controller");

const router = express.Router();

router.post  ("/work-logs",       authenticate, requirePermission("can_write"),  createWorkLogValidators,  createWorkLog);
console.log("🚀 ~ createWorkLog:", createWorkLog)
console.log("🚀 ~ requirePermission:", requirePermission)
console.log("🚀 ~ authenticate:", authenticate)
router.get   ("/work-logs",       authenticate,                                                             listWorkLogs);
router.get   ("/work-logs/:id",   authenticate,                                                             getWorkLog);
router.patch ("/work-logs/:id",   authenticate, requirePermission("can_update"), updateWorkLogValidators,  updateWorkLog);
router.delete("/work-logs/:id",   authenticate, requirePermission("can_delete"),                           deleteWorkLog);

module.exports = router;